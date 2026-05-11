import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging helper
const logFile = path.join(process.cwd(), 'server.log');
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  console.log(formattedMessage.trim());
  fs.appendFileSync(logFile, formattedMessage);
}

if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

const app = express();
const PORT = 3000;

// Generic request logger (Errors only)
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logToFile(`${req.method} ${req.url} - Status: ${res.statusCode}`);
    }
  });
  next();
});

// Setup GCS
const privateKey = process.env.GCS_PRIVATE_KEY
  ? process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1')
  : undefined;

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: privateKey,
  },
});

const bucketName = process.env.GCS_BUCKET_NAME || '';

if (!process.env.GCS_PRIVATE_KEY) logToFile('WARNING: GCS_PRIVATE_KEY is not defined in environment');
if (!privateKey?.includes('BEGIN PRIVATE KEY')) logToFile('WARNING: GCS_PRIVATE_KEY does not appear to be a valid PEM key');

// Log retrieval for debugging
app.get('/api/debug-logs', (req, res) => {
  if (fs.existsSync(logFile)) {
    const logs = fs.readFileSync(logFile, 'utf8');
    res.type('text/plain').send(logs);
  } else {
    res.status(404).send('Log file not found');
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(express.json());

// Signed URL Route for Direct GCS Upload
app.post('/api/get-upload-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    logToFile(`Generating signed URL for: ${fileName}`);
    
    if (!bucketName) {
      logToFile('ERORR: GCS_BUCKET_NAME missing');
      return res.status(500).json({ error: 'GCS_BUCKET_NAME is not configured' });
    }
    if (!process.env.GCS_PRIVATE_KEY || !process.env.GCS_CLIENT_EMAIL) {
      logToFile('ERROR: GCS credentials missing');
      return res.status(500).json({ error: 'GCS credentials missing' });
    }

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

    logToFile(`Signed URL generated for: ${fileName}`);
    res.json({ uploadUrl: url, gcsPath: destination });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Signed URL Generation Failed: ${errMsg}`);
    res.status(500).json({ 
      error: 'Failed to generate upload URL', 
      details: errMsg 
    });
  }
});

// Audio Processing Route
app.post('/api/process-audio', async (req, res) => {
  const { albumId, gcsPath } = req.body;
  logToFile(`Received processing request for album: ${albumId}, path: ${gcsPath}`);
  
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
    // 1. Download from GCS
    logToFile(`Downloading ${gcsPath} from bucket ${bucketName}...`);
    await storage.bucket(bucketName).file(gcsPath).download({
      destination: inputFile,
    });
    
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Failed to download file to ${inputFile}`);
    }
    const stats = fs.statSync(inputFile);
    logToFile(`Download complete: ${inputFile} (${stats.size} bytes)`);

    if (stats.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    // 2. Process with FFmpeg
    logToFile(`Starting HLS conversion for ${albumId}...`);
    await new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .outputOptions([
          '-c:a aac',
          '-b:a 128k',
          '-ac 2',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls'
        ])
        .output(outputPlaylist)
        .on('start', (cmd) => logToFile(`FFmpeg command: ${cmd}`))
        .on('progress', (progress) => {
          if (progress.percent) logToFile(`FFmpeg progress: ${progress.percent.toFixed(1)}%`);
        })
        .on('end', () => {
          logToFile('FFmpeg finished successfully');
          resolve(true);
        })
        .on('error', (err, stdout, stderr) => {
          logToFile(`FFmpeg error: ${err.message}`);
          logToFile(`FFmpeg stderr: ${stderr}`);
          reject(new Error(`FFmpeg failed: ${err.message}. Details: ${stderr}`));
        })
        .run();
    });

    // 3. Upload to GCS
    logToFile('Uploading results to GCS...');
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
    logToFile(`Upload complete. M3U8 URL: ${m3u8Url}`);

    // 4. Cleanup
    logToFile('Cleaning up temporary local and cloud files...');
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.unlinkSync(inputFile);
    await storage.bucket(bucketName).file(gcsPath).delete().catch(e => logToFile(`Warning: Failed to delete temp GCS file: ${e.message}`));

    res.json({ success: true, m3u8Url });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Processing Failure: ${errMsg}`);
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
    
    res.status(500).json({ error: 'Failed to process audio', details: errMsg });
  }
});

async function startServer() {
  logToFile('Starting server initialization...');
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    logToFile('Vite middleware integrated');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    logToFile('Production static serving active');
  }

  app.listen(PORT, '0.0.0.0', () => {
    logToFile(`Server actually listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => logToFile(`Startup Crash: ${err.message}`));

