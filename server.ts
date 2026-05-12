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
const logFile = path.resolve(__dirname, 'server.log');
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  console.log(formattedMessage.trim());
  try {
    fs.appendFileSync(logFile, formattedMessage);
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
}

// Ensure the log file exists
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, `Starting server at ${new Date().toISOString()}\n`);
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
const uploadsBaseDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

app.use(express.json());

app.use((req, res, next) => {
  if (req.method === 'POST') {
    logToFile(`POST ${req.url} body keys: ${Object.keys(req.body).join(', ')}`);
  }
  next();
});

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

    const { albumId } = req.body;
    let destination;
    if (albumId) {
      // Manual upload to final destination
      destination = `audio/${albumId}/${fileName}`;
    } else {
      destination = `temp-uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    }

    const file = storage.bucket(bucketName).file(destination);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 30 * 60 * 1000, // 30 minutes
      contentType,
    });

    logToFile(`Signed URL generated for: ${fileName}`);
    res.json({ uploadUrl: url, gcsPath: destination, bucketName: bucketName });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Signed URL Generation Failed: ${errMsg}`);
    res.status(500).json({ 
      error: 'Failed to generate upload URL', 
      details: errMsg 
    });
  }
});

// Route to upload artwork (base64) to GCS
app.post('/api/upload-artwork', async (req, res) => {
  try {
    const { base64, albumTitle } = req.body;
    if (!base64 || !albumTitle) {
      return res.status(400).json({ error: 'base64 and albumTitle are required' });
    }

    if (!bucketName) {
      return res.status(500).json({ error: 'GCS_BUCKET_NAME is not configured' });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 format' });
    }

    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const extension = type.split('/')[1] || 'png';
    const safeTitle = albumTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `artwork/${safeTitle}-${Date.now()}.${extension}`;

    const file = storage.bucket(bucketName).file(fileName);
    await file.save(buffer, {
      metadata: { contentType: type },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    logToFile(`Artwork uploaded to GCS: ${publicUrl}`);
    res.json({ url: publicUrl });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Artwork Upload Failed: ${errMsg}`);
    res.status(500).json({ error: 'Failed to upload artwork', details: errMsg });
  }
});

// Audio Processing Route
app.post('/api/process-audio', async (req, res) => {
  const { albumId, gcsPath } = req.body;
  logToFile(`Received processing request for album: ${albumId}, path: ${gcsPath}`);
  console.log(`[PROCESS] ${albumId} - ${gcsPath}`);
  
  if (!albumId || !gcsPath) {
    return res.status(400).json({ error: 'Album ID and GCS Path are required' });
  }

  if (!bucketName) {
    logToFile('ERROR: GCS_BUCKET_NAME missing in processing route');
    return res.status(500).json({ error: 'GCS_BUCKET_NAME is not configured' });
  }

  const inputFile = path.join(uploadsBaseDir, `input-${Date.now()}.wav`);
  const outputDir = path.join(uploadsBaseDir, albumId);
  
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
    logToFile(`Input exists: ${fs.existsSync(inputFile)}`);
    logToFile(`Output dir exists: ${fs.existsSync(outputDir)}`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .outputOptions([
          '-y',
          '-c:a aac',
          '-b:a 128k',
          '-ac 2',
          '-ar 44100',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls'
        ])
        .output(outputPlaylist)
        .on('start', (cmd) => logToFile(`FFmpeg command: ${cmd}`))
        .on('progress', (progress) => {
          if (progress.percent !== undefined) logToFile(`FFmpeg progress: ${progress.percent.toFixed(1)}%`);
        })
        .on('end', () => {
          logToFile('FFmpeg finished successfully');
          resolve(true);
        })
        .on('error', (err, stdout, stderr) => {
          logToFile(`FFmpeg error: ${err.message}`);
          logToFile(`FFmpeg stderr: ${stderr || 'no stderr'}`);
          logToFile(`FFmpeg stdout: ${stdout || 'no stdout'}`);
          reject(new Error(`FFmpeg failed: ${err.message}. Details: ${stderr}`));
        })
        .run();
    });

    // 3. Upload to GCS
    logToFile('Uploading results to GCS...');
    const files = fs.readdirSync(outputDir);
    logToFile(`Found ${files.length} files to upload in ${outputDir}`);
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
    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
    await storage.bucket(bucketName).file(gcsPath).delete().catch(e => logToFile(`Warning: Failed to delete temp GCS file: ${e.message}`));

    res.json({ success: true, m3u8Url });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Processing Failure: ${errMsg}`);
    // Keep files on failure for debugging
    logToFile(`Failure detected. Files preserved in ${outputDir} and ${inputFile} for now.`);
    // if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    // if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
    
    res.status(500).json({ error: 'Failed to process audio', details: errMsg });
  }
});

async function startServer() {
  logToFile('Starting server initialization...');
  
  if (ffmpegInstaller) {
    try {
      const { execSync } = await import('child_process');
      const version = execSync(`${ffmpegInstaller} -version`).toString().split('\n')[0];
      logToFile(`FFmpeg available: ${version}`);
    } catch (e) {
      logToFile(`Warning: Could not get FFmpeg version: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

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

  const server = app.listen(PORT, '0.0.0.0', () => {
    logToFile(`Server actually listening on http://0.0.0.0:${PORT}`);
  });
  server.timeout = 600000; // 10 minutes
}

startServer().catch(err => logToFile(`Startup Crash: ${err.message}`));

