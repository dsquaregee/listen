import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Setup GCS
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME || '';

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(express.json());

// Signed URL Route for Direct GCS Upload
app.post('/api/get-upload-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }

    const destination = `temp-uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const file = storage.bucket(bucketName).file(destination);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 30 * 60 * 1000, // 30 minutes
      contentType,
    });

    res.json({ uploadUrl: url, gcsPath: destination });
  } catch (error) {
    console.error('Signed URL Error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Audio Processing Route (Improved to process from GCS)
app.post('/api/process-audio', async (req, res) => {
  const { albumId, gcsPath } = req.body;
  
  if (!albumId || !gcsPath) {
    return res.status(400).json({ error: 'Album ID and GCS Path are required' });
  }

  const inputFile = path.join('uploads', `input-${Date.now()}.wav`);
  const outputDir = path.join('uploads', albumId);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPlaylist = path.join(outputDir, 'playlist.m3u8');

  try {
    // 1. Download from GCS to local disk for processing
    console.log(`Downloading ${gcsPath} for processing...`);
    await storage.bucket(bucketName).file(gcsPath).download({
      destination: inputFile,
    });

    // 2. Process with FFmpeg to HLS
    console.log(`Starting HLS processing for ${albumId}...`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .outputOptions([
          '-profile:a aac_low',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls'
        ])
        .output(outputPlaylist)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    console.log('FFmpeg processing complete. Starting GCS upload...');

    // 3. Upload segments/playlist to GCS
    const files = fs.readdirSync(outputDir);
    const uploadPromises = files.map(async (file) => {
      const filePath = path.join(outputDir, file);
      const destination = `audio/${albumId}/${file}`;
      
      await storage.bucket(bucketName).upload(filePath, {
        destination,
        public: true,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      return `https://storage.googleapis.com/${bucketName}/${destination}`;
    });

    const urls = await Promise.all(uploadPromises);
    const m3u8Url = urls.find(url => url.endsWith('.m3u8'));

    // 4. Cleanup
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.unlinkSync(inputFile);
    // Delete the temp upload in GCS
    await storage.bucket(bucketName).file(gcsPath).delete().catch(e => console.warn('Failed to delete temp file:', e));

    res.json({ 
      success: true, 
      m3u8Url,
      message: 'Processing and upload successful'
    });

  } catch (error) {
    console.error('Processing error:', error);
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
    
    res.status(500).json({ error: 'Failed to process audio', details: error instanceof Error ? error.message : String(error) });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
