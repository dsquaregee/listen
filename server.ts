import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { initializeApp, cert, getApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

dotenv.config();

// Initialize Firebase Admin
const privateKey = process.env.GCS_PRIVATE_KEY
  ? process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1')
  : undefined;

if (process.env.GCS_PROJECT_ID && process.env.GCS_CLIENT_EMAIL && privateKey) {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.GCS_PROJECT_ID,
          clientEmail: process.env.GCS_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }
    logToFile('Firebase Admin initialized successfully');
  } catch (e) {
    logToFile(`Failed to initialize Firebase Admin: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// Ensure the db is using the correct database instance from config
const getAdminDb = () => getFirestore(getApp(), firebaseConfig.firestoreDatabaseId);

let stripeClient: Stripe | null = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Unified directory handling for both ESM and CJS
// In bundled CJS, __dirname is available. In ESM (tsx), import.meta.url is used.
let _dirname: string;
try {
  _dirname = __dirname;
} catch (e) {
  _dirname = path.dirname(fileURLToPath(import.meta.url));
}

// We prefer process.cwd() for persistent/generated files to keep them consistent
// regardless of where the server script is located (root or dist/)
const logFile = path.resolve(process.cwd(), 'server.log');
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  console.log(formattedMessage.trim());
  try {
    fs.appendFileSync(logFile, formattedMessage);
  } catch (e) {
    // Fallback if filesystem is read-only or error occurs
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
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Generic request logger (Errors only)
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logToFile(`${req.method} ${req.url} - Status: ${res.statusCode}`);
    }
  });
  next();
});

let storage: Storage | null = null;
function getStorage() {
  if (!storage) {
    const privateKey = process.env.GCS_PRIVATE_KEY
      ? process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1')
      : undefined;

    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: privateKey,
      },
    });
  }
  return storage;
}

const bucketName = process.env.GCS_BUCKET_NAME || '';

if (!process.env.GCS_PRIVATE_KEY) logToFile('WARNING: GCS_PRIVATE_KEY is not defined in environment');
const pk = process.env.GCS_PRIVATE_KEY || '';
if (pk && !pk.includes('BEGIN PRIVATE KEY')) logToFile('WARNING: GCS_PRIVATE_KEY does not appear to be a valid PEM key');

// Log retrieval for debugging
app.get('/api/debug-logs', (req, res) => {
  if (fs.existsSync(logFile)) {
    const logs = fs.readFileSync(logFile, 'utf8');
    res.type('text/plain').send(logs);
  } else {
    res.status(404).send('Log file not found');
  }
});

// Ensure the uploads directory exists
const uploadsBaseDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsBaseDir)) {
  logToFile(`Creating uploads directory: ${uploadsBaseDir}`);
  try {
    fs.mkdirSync(uploadsBaseDir, { recursive: true });
  } catch (e) {
    logToFile(`Warning: Could not create uploads directory (might be read-only FS): ${e instanceof Error ? e.message : String(e)}`);
  }
}

// STRIPE WEBHOOK (Must be before general express.json middleware)
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      throw new Error('Missing stripe-signature or webhook secret');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logToFile(`Webhook Error: ${errMsg}`);
    return res.status(400).send(`Webhook Error: ${errMsg}`);
  }

  logToFile(`Stripe Event received: ${event.type}`);

  try {
    const db = getAdminDb();
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;

      if (userId) {
        logToFile(`Updating user ${userId} to premium tier (Session)`);
        await db.collection('users').doc(userId).set({
          tier: 'premium',
          stripeCustomerId: customerId,
          subscriptionId: session.subscription,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const tier = (status === 'active' || status === 'trialing') ? 'premium' : 'free';
        
        logToFile(`Updating user ${userDoc.id} tier to ${tier} (Sub Update)`);
        await userDoc.ref.update({
          tier: tier,
          subscriptionId: subscription.id,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    logToFile(`Firestore Update Error (Webhook): ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).send('Webhook Processing Failed');
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

    const file = getStorage().bucket(bucketName).file(destination);

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
      logToFile('Artwork Upload: Missing base64 or albumTitle');
      return res.status(400).json({ error: 'base64 and albumTitle are required' });
    }

    const payloadSize = Buffer.byteLength(base64, 'utf8');
    logToFile(`Artwork Upload: Received payload for "${albumTitle}", size: ${payloadSize} bytes`);

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

    const file = getStorage().bucket(bucketName).file(fileName);
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
    await getStorage().bucket(bucketName).file(gcsPath).download({
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
      
      await getStorage().bucket(bucketName).upload(filePath, {
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
    await getStorage().bucket(bucketName).file(gcsPath).delete().catch(e => logToFile(`Warning: Failed to delete temp GCS file: ${e.message}`));

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

// Stripe Checkout Session Route
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, priceId } = req.body;
    logToFile(`Creating subscription session for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const stripe = getStripe();
    const finalPriceId = priceId || process.env.STRIPE_PRICE_ID;
    
    if (!finalPriceId) {
      return res.status(400).json({ error: 'No Price ID provided or configured' });
    }

    // Determine the base URL for redirects
    // req.headers.origin is typically available in fetch, but fallback to host for redirected links or if missing
    let baseUrl = req.headers.origin;
    if (!baseUrl || baseUrl === 'null') {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      baseUrl = `${protocol}://${host}`;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: userId,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: process.env.STRIPE_SUCCESS_URL || `${baseUrl}/profile?payment=success`,
      cancel_url: process.env.STRIPE_CANCEL_URL || `${baseUrl}/premium?payment=cancelled`,
    });

    logToFile(`Checkout session created: ${session.id}`);
    res.json({ url: session.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Checkout Session Failure: ${errMsg}`);
    res.status(500).json({ error: 'Failed to create checkout session', details: errMsg });
  }
});

// Stripe Customer Portal Session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const stripe = getStripe();

    let baseUrl = req.headers.origin;
    if (!baseUrl || baseUrl === 'null') {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      baseUrl = `${protocol}://${host}`;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/profile`,
    });

    res.json({ url: session.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Portal Session Failure: ${errMsg}`);
    res.status(500).json({ error: 'Failed to create portal session', details: errMsg });
  }
});

// Global error handlers for better crash reporting
process.on('uncaughtException', (err) => {
  logToFile(`CRITICAL: Uncaught Exception: ${err.message}`);
  logToFile(err.stack || 'No stack trace');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logToFile(`CRITICAL: Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

async function startServer() {
  logToFile('Starting server initialization...');
  logToFile(`NODE_ENV: ${process.env.NODE_ENV}`);
  logToFile(`Working directory: ${process.cwd()}`);
  logToFile(`__dirname: ${_dirname}`);

  if (ffmpegInstaller) {
    try {
      const { execSync } = await import('child_process');
      const version = execSync(`${ffmpegInstaller} -version`).toString().split('\n')[0];
      logToFile(`FFmpeg available: ${version}`);
    } catch (e) {
      logToFile(`Warning: Could not get FFmpeg version: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_VITE !== 'true') {
    logToFile('Integrating Vite middleware (Development mode)');
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      logToFile('Vite middleware integrated successfully');
    } catch (e) {
      logToFile(`Error integrating Vite: ${e instanceof Error ? e.message : String(e)}`);
      // Fallback to static in case Vite fails even in dev
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        logToFile('Vite failed, falling back to static dist in dev mode');
        app.use(express.static(distPath));
      }
    }
  } else {
    logToFile('Starting Production mode (Static Serving)');
    const distPath = path.join(process.cwd(), 'dist');
    logToFile(`Static assets path: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      logToFile('Production static serving active');
    } else {
      logToFile(`ERROR: Dist path not found at ${distPath}. Did build run?`);
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logToFile(`Server actually listening on http://0.0.0.0:${PORT}`);
  });

  // Global SPA Catch-all (Must be last)
  // This ensures that even if Vite or static serving falls through, 
  // we attempt to serve index.html for unknown paths to support SPA routing.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_VITE !== 'true') {
      // In development, the request should have been caught by Vite middlewares.
      // If we are here, it means Vite didn't handle it. This might happen if the path
      // has an extension that Vite thinks is a static file but doesn't exist.
      // We log it to help debug.
      logToFile(`Dev Fallthrough: ${req.method} ${req.url}`);
      next();
    } else {
      next();
    }
  });

  server.timeout = 600000; // 10 minutes
  
  // Handle server errors
  server.on('error', (err) => {
    logToFile(`Server Listen Error: ${err.message}`);
  });

  // Optional: Try to set CORS for the bucket if we have permissions
  if (bucketName) {
    try {
      logToFile(`Attempting to ensure CORS for bucket: ${bucketName}`);
      await getStorage().bucket(bucketName).setCorsConfiguration([
        {
          maxAgeSeconds: 3600,
          method: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
          origin: ['*'],
          responseHeader: ['Content-Type', 'x-goog-resumable'],
        },
      ]);
      logToFile('CORS configuration applied successfully.');
    } catch (e) {
      logToFile(`Warning: Could not automatically set CORS (this is common if the service account lacks storage.buckets.update): ${e instanceof Error ? e.message : String(e)}`);
      logToFile('Manual tip: Ensure your GCS bucket has CORS allowed for your domain.');
    }
  }
}

startServer().catch(err => logToFile(`Startup Crash: ${err.message}`));

