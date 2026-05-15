import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { initializeApp, cert, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const FieldValue = admin.firestore.FieldValue;

dotenv.config();

// Initialize Firebase Admin
const privateKey = process.env.GCS_PRIVATE_KEY
  ? process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1')
  : undefined;

// We'll initialize inside startServer() to ensure proper logging


// Ensure the db is using the correct database instance from config
const getAdminDb = () => {
  try {
    const app = getApp();
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    // In firebase-admin, getFirestore(app, dbId) is the correct way to target a specific database
    // @ts-ignore
    const db = getFirestore(app, dbId);
    return db;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logToFile(`Admin Firestore Retrieval Error: ${msg}`);
    // Fallback to default
    return getFirestore();
  }
};

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

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
}));

// Generic request logger
app.use((req, res, next) => {
  logToFile(`${req.method} ${req.url}`);
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logToFile(`STATUS ERROR: ${req.method} ${req.url} - Status: ${res.statusCode}`);
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
      const userId = session.client_reference_id || session.metadata?.internal_user_id;
      const customerId = session.customer as string;

      logToFile(`Stripe Webhook: Checkout Completed - session=${session.id}, user=${userId}, customer=${customerId}`);

      if (userId) {
        // Expand subscription to get status
        const sessionWithSub = await stripe.checkout.sessions.retrieve(session.id, { expand: ['subscription'] });
        const subscription = sessionWithSub.subscription as Stripe.Subscription;
        const status = subscription?.status || 'active';
        
        logToFile(`Stripe Webhook: Activating Premium for ${userId} (Status: ${status})`);
        
        await db.collection('users').doc(userId).set({
          tier: 'premium',
          stripeCustomerId: customerId,
          subscriptionId: subscription?.id || (typeof session.subscription === 'string' ? session.subscription : null),
          subscriptionStatus: status,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        
        logToFile(`Stripe Webhook: Activation SUCCESS for ${userId}`);
      } else {
        logToFile('Stripe Webhook: CRITICAL - Session completed without internal_user_id or client_reference_id');
      }
    }

    if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      const userId = subscription.metadata?.internal_user_id;

      logToFile(`Stripe Webhook: Subscription Event ${event.type} - customer=${customerId}, status=${status}, user_metadata=${userId}`);

      let targetUserDoc: admin.firestore.DocumentSnapshot | null = null;

      // 1. Try Metadata
      if (userId) {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) targetUserDoc = doc;
      }

      // 2. Try Customer ID mapping in DB
      if (!targetUserDoc) {
        const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
        if (!usersSnapshot.empty) {
          targetUserDoc = usersSnapshot.docs[0];
        }
      }

      if (targetUserDoc) {
        const tier = (status === 'active' || status === 'trialing') ? 'premium' : 'free';
        logToFile(`Stripe Webhook: Syncing user ${targetUserDoc.id} to tier ${tier} (Status: ${status})`);
        
        await targetUserDoc.ref.update({
          tier: tier,
          subscriptionId: subscription.id,
          subscriptionStatus: status,
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        logToFile(`Stripe Webhook: Orphaned subscription event for customer ${customerId}. No matching user found.`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    const err = error as any;
    logToFile(`Webhook Processing FAILED: ${err.message}`);
    console.error('Webhook Error:', err);
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
    logToFile(`Stripe: Initiating checkout for user ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    const userData = userDoc.data();
    const stripe = getStripe();

    // 1. Resolve Stripe Customer ID (Deterministic)
    let stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      logToFile(`Stripe: No customer ID in DB for ${userId}. searching by email: ${userData?.email}`);
      // Fallback 1: Search by email
      if (userData?.email) {
        const customers = await stripe.customers.list({ email: userData.email, limit: 1 });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
          logToFile(`Stripe: Found existing customer ID by email: ${stripeCustomerId}`);
        }
      }

      // Fallback 2: Create new customer
      if (!stripeCustomerId) {
        logToFile(`Stripe: Creating new customer for ${userId}`);
        const customer = await stripe.customers.create({
          email: userData?.email,
          name: userData?.displayName,
          metadata: {
            internal_user_id: userId,
            app_environment: process.env.NODE_ENV || 'production'
          }
        });
        stripeCustomerId = customer.id;
        logToFile(`Stripe: Created new customer ${stripeCustomerId}`);
      }

      // 2. Persist Customer ID immediately
      logToFile(`Stripe: Persisting customer ID ${stripeCustomerId} for user ${userId}`);
      await db.collection('users').doc(userId).update({
        stripeCustomerId: stripeCustomerId,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    const finalPriceId = priceId || process.env.STRIPE_PRICE_ID;
    if (!finalPriceId) {
      return res.status(400).json({ error: 'No Price ID provided or configured' });
    }

    // Determine the base URL for redirects
    let baseUrl = req.headers.origin;
    if (!baseUrl || baseUrl === 'null') {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      baseUrl = `${protocol}://${host}`;
    }

    // 3. Create Checkout Session with Mandatory Identity Linkage
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [{ price: finalPriceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          internal_user_id: userId
        }
      },
      metadata: {
        internal_user_id: userId
      },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/premium?payment=cancelled`,
    });

    logToFile(`Stripe: Checkout session ${session.id} created for ${userId}`);
    res.json({ url: session.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Stripe: Checkout Session Failure - ${errMsg}`);
    res.status(500).json({ error: 'Failed to create checkout session', details: errMsg });
  }
});

// Verify Stripe Session (Deterministic Activation)
app.post('/api/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    logToFile(`Stripe: Verifying success for session ${sessionId}`);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    const subscription = session.subscription as Stripe.Subscription;
    const subStatus = subscription?.status;
    const userId = session.client_reference_id || session.metadata?.internal_user_id;
    const customerId = session.customer as string;

    logToFile(`Stripe: Verify - session=${session.id}, user=${userId}, customer=${customerId}, status=${subStatus}`);

    if (subStatus === 'active' || subStatus === 'trialing') {
      if (userId) {
        const db = getAdminDb();
        logToFile(`Stripe: Deterministic activation for user ${userId}`);
        
        await db.collection('users').doc(userId).set({
          tier: 'premium',
          stripeCustomerId: customerId,
          subscriptionId: subscription.id,
          subscriptionStatus: subStatus,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        return res.json({ success: true, tier: 'premium' });
      } else {
        logToFile('Stripe: Verify error - Could not resolve userId from session');
        return res.status(404).json({ error: 'Verification failed: User identity missing in session' });
      }
    }

    res.status(400).json({ error: 'Subscription not active', status: subStatus });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Stripe: Session Verification Failure - ${errMsg}`);
    res.status(500).json({ error: 'Verification failed', details: errMsg });
  }
});

// Stripe Customer Portal Session
app.post('/api/create-portal-session', async (req, res) => {
  logToFile(`Create Portal Session requested: ${JSON.stringify(req.body)}`);
  try {
    const { customerId } = req.body;
    if (!customerId) {
      logToFile('Portal Session: Missing Customer ID');
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const stripe = getStripe();

    let baseUrl = req.headers.origin;
    if (!baseUrl || baseUrl === 'null') {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      baseUrl = `${protocol}://${host}`;
    }
    
    logToFile(`Portal Session for ${customerId} with return_url: ${baseUrl}/profile`);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/profile`,
    });

    res.json({ url: session.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Portal Session Error:', error);
    logToFile(`Portal Session Failure: ${errMsg}`);
    res.status(500).json({ error: 'Failed to create portal session', details: errMsg });
  }
});

// Admin/System: Sync user subscription from Stripe manually
app.post('/api/sync-user-stripe', async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    logToFile(`Stripe Sync: Starting manual sync for user ${userId} (Email hint: ${email})`);
    
    const db = getAdminDb();
    let userData: any = { email: email };
    
    // Try to get email from DB if not provided, but don't fail if DB is inaccessible
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        userData = { ...userData, ...userDoc.data() };
      }
    } catch (dbErr) {
      logToFile(`Stripe Sync: DB Read Failed (UserId: ${userId}), continuing with hint email: ${email}`);
    }

    if (!userData.email) {
      return res.status(400).json({ error: 'No email found for user. Please ensure your profile is initialized.' });
    }

    const stripe = getStripe();
    let stripeCustomerId = userData?.stripeCustomerId;
    let subscription: Stripe.Subscription | null = null;

    // 1. Resolve Customer ID if missing (by Email)
    if (!stripeCustomerId && userData?.email) {
      logToFile(`Stripe Sync: Searching Stripe for customer by email: ${userData.email}`);
      const customers = await stripe.customers.list({ email: userData.email, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        logToFile(`Stripe Sync: Found Stripe Customer ID via email: ${stripeCustomerId}`);
      }
    }

    // 2. Fetch Subscription by Customer ID
    if (stripeCustomerId) {
      logToFile(`Stripe Sync: Checking subscriptions for customer ${stripeCustomerId}`);
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        subscription = subscriptions.data[0];
      }
    }

    // 3. Fallback: Search recently completed checkout sessions with metadata
    if (!subscription) {
      logToFile(`Stripe Sync: No subscription found by customer ID, searching recent sessions for internal_user_id: ${userId}`);
      const sessions = await stripe.checkout.sessions.list({ limit: 100 });
      const userSession = sessions.data.find(s => 
        (s.client_reference_id === userId || s.metadata?.internal_user_id === userId || s.customer_email === userData.email) && 
        s.payment_status === 'paid'
      );
      
      if (userSession && userSession.subscription) {
        logToFile(`Stripe Sync: Found successful session ${userSession.id} with subscription ${userSession.subscription}`);
        subscription = await stripe.subscriptions.retrieve(userSession.subscription as string);
        if (!stripeCustomerId) stripeCustomerId = userSession.customer as string;
      }
    }

    // 4. Final Verification and Persistence
    if (subscription) {
      const status = subscription.status;
      const tier = (status === 'active' || status === 'trialing') ? 'premium' : 'free';
      
      logToFile(`Stripe Sync SUCCESS: Found sub ${subscription.id} (${status}). Activating tier: ${tier}`);
      
      // Attempt backend write - let's be more verbose
      try {
        logToFile(`Stripe Sync: Attempting backend write to users/${userId} for database ${firebaseConfig.firestoreDatabaseId}`);
        await db.collection('users').doc(userId).set({
          tier: tier,
          stripeCustomerId: stripeCustomerId,
          subscriptionId: subscription.id,
          subscriptionStatus: status,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        logToFile(`Stripe Sync: Backend Firestore write SUCCESS for ${userId}`);
      } catch (writeErr: any) {
        const errDetails = writeErr?.message || String(writeErr);
        logToFile(`Stripe Sync CRITICAL ERROR: Backend write failed for ${userId}. Error: ${errDetails}`);
        // We still return success: true because the client will also attempt a write, 
        // but we should probably tell the client if the backend failed.
        return res.json({ 
          success: true, 
          backendWriteError: errDetails,
          stripeCustomerId, 
          tier, 
          status,
          subscriptionId: subscription.id
        });
      }
    }

    logToFile(`Stripe Sync: Final - No subscription found for user ${userId}`);
    return res.json({ 
      success: false, 
      message: 'No active subscription found in Stripe. If you just paid, please wait a few seconds and try again.' 
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`Stripe Sync Failure: ${errMsg}`);
    res.status(500).json({ error: 'Sync failed', details: errMsg });
  }
});

// Database Health & Maintenance
app.get('/api/db-health', async (req, res) => {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  logToFile(`DB Health: Starting check for ${dbId} in project ${firebaseConfig.projectId}`);
  try {
    const db = getAdminDb();
    const start = Date.now();
    // Simple light query to check connectivity
    logToFile(`DB Health: Pinging 'categories' collection...`);
    const sn = await db.collection('categories').limit(1).get();
    const latency = Date.now() - start;
    logToFile(`DB Health: SUCCESS. Latency ${latency}ms, Docs found: ${sn.size}`);
    
    res.json({
      status: 'Healthy',
      latency: `${latency}ms`,
      databaseId: dbId,
      project: firebaseConfig.projectId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logToFile(`DB Health: FAILED. Error: ${errMsg}`);
    res.status(500).json({ status: 'Unhealthy', error: errMsg });
  }
});

// Admin System Maintenance (Cleanup orphaned sessions if TTL is not used)
app.post('/api/admin/db-maintenance', async (req, res) => {
  try {
    const db = getAdminDb();
    const isAdmin = true; // In real app, verify admin session here
    
    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

    logToFile('Admin: Starting DB Maintenance...');
    
    // Example: Find sessions without an expireAt field and add it (Migration)
    const sessions = await db.collection('listening_sessions').where('expireAt', '==', null).limit(100).get();
    
    if (sessions.empty) {
      return res.json({ message: 'No immediate maintenance required. Database is optimized.' });
    }

    const batch = db.batch();
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 90);

    sessions.forEach(doc => {
      batch.update(doc.ref, { expireAt });
    });

    await batch.commit();
    logToFile(`Admin: Maintenance complete. Updated ${sessions.size} sessions for TTL.`);
    
    res.json({ 
      success: true, 
      message: `Database recalibrated. ${sessions.size} legacy records optimized for TTL.` 
    });
  } catch (error) {
    res.status(500).json({ error: 'Maintenance failed', details: error instanceof Error ? error.message : String(error) });
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
  
  // Initialize Firebase Admin inside the lifecycle to ensure logging and fresh state
  try {
    if (getApps().length === 0) {
      const targetProject = firebaseConfig.projectId;
      
      logToFile(`Firebase Config Project: ${targetProject}`);
      
      // We prefer applicationDefault() in AI Studio as it usually has the correct ambient permissions
      try {
        logToFile(`Initializing Firebase Admin with ADC targeting project: ${targetProject}`);
        initializeApp({
          projectId: targetProject,
          credential: admin.credential.applicationDefault()
        });
        logToFile('Firebase Admin initialized with ADC');
      } catch (adcErr: any) {
        logToFile(`ADC Init Failed: ${adcErr?.message || String(adcErr)}. Trying Cert fallback.`);
        
        const gcsProject = process.env.GCS_PROJECT_ID;
        if (gcsProject && process.env.GCS_CLIENT_EMAIL && privateKey) {
          logToFile(`Attempting initialization with service account cert: ${process.env.GCS_CLIENT_EMAIL}`);
          try {
            initializeApp({
              credential: cert({
                projectId: gcsProject,
                clientEmail: process.env.GCS_CLIENT_EMAIL,
                privateKey: privateKey,
              }),
              projectId: targetProject
            });
            logToFile('Firebase Admin initialized with Service Account Cert');
          } catch (certErr: any) {
            logToFile(`Cert Init Failed: ${certErr?.message || String(certErr)}. Trying minimal init.`);
            initializeApp({ projectId: targetProject });
            logToFile('Firebase Admin initialized with minimal config (no explicit credential)');
          }
        } else {
          logToFile('No cert credentials available, trying minimal init.');
          initializeApp({ projectId: targetProject });
          logToFile('Firebase Admin initialized with minimal config (no explicit credential)');
        }
      }
    }
    logToFile('Firebase Admin initialization block complete');
  } catch (e) {
    logToFile(`CRITICAL: Firebase Admin failed: ${e instanceof Error ? e.message : String(e)}`);
  }

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

  // Robust path resolution for both local and container environments
  const rootDir = process.cwd();
  const distPath = path.resolve(rootDir, 'dist');
  const prodIndex = path.resolve(distPath, 'index.html');
  const devIndex = path.resolve(rootDir, 'index.html');

  logToFile(`Path Check: Root=${rootDir}, Dist=${distPath}, ProdIndex=${fs.existsSync(prodIndex)}`);

  if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_VITE !== 'true' && process.env.DISABLE_VITE !== '1') {
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
      if (fs.existsSync(distPath)) {
        logToFile('Vite failed, falling back to static dist');
        app.use(express.static(distPath, { 
          index: false,
          maxAge: '1h', // Browser caching
          setHeaders: (res, filePath) => {
            if (filePath.match(/\.(js|css|woff2|png|jpg|jpeg|gif|svg|mp3|m4a|mp4)$/)) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // CDN caching
            }
          }
        }));
      }
    }
  } else {
    logToFile('Starting Production mode (Static Serving)');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { 
        index: false,
        maxAge: '1h',
        setHeaders: (res, filePath) => {
          if (filePath.match(/\.(js|css|woff2|png|jpg|jpeg|gif|svg|mp3|m4a|mp4)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        }
      }));
      logToFile('Production static serving active');
    } else {
      logToFile(`WARNING: Dist path not found at ${distPath}. Continuing with root index fallback.`);
    }
  }

  // Explicit route for Premium to handle Stripe redirects reliably
  app.get('/premium', (req, res) => {
    const target = (process.env.NODE_ENV === 'production') ? prodIndex : devIndex;
    logToFile(`Explicit /premium hit: ${req.url} -> serving ${target}`);
    res.sendFile(fs.existsSync(target) ? target : devIndex);
  });

  // Global SPA Catch-all - MUST be after all other routes and static middleware
  app.get('*', (req, res, next) => {
    // 1. Skip API routes - let them 404 naturally
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // 2. IMPORTANT: Skip anything that looks like a static asset/file
    // If it has an extension, it should have been caught by vite.middlewares or express.static
    // If it reaches here, it means the file is MISSING. We should 404, not send index.html.
    const ext = path.extname(req.path);
    if (ext) {
      // In development, sometimes source files are requested but might be missed by Vite's first pass
      // We check if the file actually exists on disk before 404ing
      const fullPath = path.join(process.cwd(), req.path);
      if (fs.existsSync(fullPath)) {
        // If it's a source file or map being requested in what looks like a production context,
        // we just 404 silently to avoid log clutter
        if (req.path.startsWith('/src') || req.path.endsWith('.map')) {
          return res.status(404).send('Resource not found');
        }
        return next();
      }

      logToFile(`404 Asset Missing: ${req.url}`);
      return res.status(404).send('Resource not found');
    }

    // 3. Resolve index.html target for navigation
    // Prefer production index if it exists, otherwise fall back to root index
    let targetIndex = fs.existsSync(prodIndex) ? prodIndex : devIndex;
    
    logToFile(`SPA Routing Navigation: ${req.url} -> ${targetIndex}`);
    
    res.sendFile(targetIndex, (err) => {
      if (err) {
        logToFile(`Error sending index.html for ${req.url}: ${err.message}`);
        res.status(404).send('Application temporarily unavailable. Please refresh.');
      }
    });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    logToFile(`Server actually listening on http://0.0.0.0:${PORT}`);
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

