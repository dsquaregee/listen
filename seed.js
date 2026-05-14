import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

// Mock data content directly so we don't have to worry about paths/types in a simple script
const MOCK_CATEGORIES = [
  { id: '1', name: 'Carnatic Instrumental', slug: 'carnatic-instrumental', description: 'Traditional Ragam & Talam', visualIdentity: 'bg-gradient-to-br from-[#004040] to-[#002020] border-primary/20 hover:border-primary/50', order: 1 },
  { id: '2', name: 'Kinetic Fire', slug: 'fusion-fast', description: 'Fusion Fast', visualIdentity: 'bg-gradient-to-br from-[#3D1E1E] to-[#1E0F0F] border-red-500/20 hover:border-red-500/50', order: 2 },
  { id: '3', name: 'Deep Cosmos', slug: 'fusion-slow', description: 'Fusion Slow', visualIdentity: 'bg-gradient-to-br from-[#1E0F2D] to-[#0F0516] border-primary/20 hover:border-primary/50', order: 3 },
  { id: '4', name: 'Sacred Glow', slug: 'devotional', description: 'Devotional Chants', visualIdentity: 'bg-gradient-to-br from-[#3D1E3D] to-[#1E0F1E] border-[#6A4C93]/40 hover:border-[#6A4C93]', order: 4 }
];

const MOCK_ALBUMS = [
  { id: 'a1', title: 'Divine Veena Resonance', artist: 'Jayanthi Kumaresh', duration: 3600, coverUrl: 'https://images.unsplash.com/photo-1514525253361-9f6fa183c5a6?auto=format&fit=crop&q=80&w=811', hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', categoryId: '1', description: 'An hour of meditative Veena exploration in Raga Shankarabharanam.', featured: true, tier: 'premium' },
  { id: 'a2', title: 'Balkan Nadaswaram', artist: 'Fusion Collective', duration: 3600, coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800', hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', categoryId: '2', description: 'High-energy explosive fusion of Balkan brass and Carnatic Nadaswaram.', tier: 'free' },
  { id: 'a3', title: 'Cosmic Flute Textures', artist: 'Eternal Echoes', duration: 3600, coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=870', hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', categoryId: '3', description: 'Deep emotional floating ambient raga textures with bamboo flute.', tier: 'premium' },
  { id: 'a4', title: 'Shiva Chants: Infinite Om', artist: 'Veda Chants', duration: 3600, coverUrl: 'https://images.unsplash.com/photo-1604881988758-f76ad2f7accf?auto=format&fit=crop&q=80&w=870', hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', categoryId: '4', description: 'Sacred meditative mantra journey into the heart of Shiva.', tier: 'free' },
  { id: 'a5', title: 'Ghatam Pulse', artist: 'Percussion Project', duration: 3600, coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=870', hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', categoryId: '2', description: 'Rhythmic exploration of the clay pot percussion in a fusion context.', tier: 'free' },
  { id: 'a6', title: 'Violin Horizons', artist: 'Strings of Silk', duration: 3600, coverUrl: 'https://images.unsplash.com/photo-1465821508027-56738242295d?auto=format&fit=crop&q=80&w=870', hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', categoryId: '1', description: 'Sweeping Carnatic violin melodies over cinematic orchestral landscapes.', tier: 'premium' }
];

async function seed() {
  console.log('Starting standalone seeding script...');
  
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const privateKey = process.env.GCS_PRIVATE_KEY
    ? process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1')
    : undefined;

  if (!process.env.GCS_PROJECT_ID || !process.env.GCS_CLIENT_EMAIL || !privateKey) {
    console.error('Missing GCS credentials in environment');
    process.exit(1);
  }

  initializeApp({
    credential: cert({
      projectId: process.env.GCS_PROJECT_ID,
      clientEmail: process.env.GCS_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });

  const db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId);
  console.log('Using database ID:', firebaseConfig.firestoreDatabaseId);

  const batch = db.batch();

  for (const cat of MOCK_CATEGORIES) {
    console.log(`Adding category: ${cat.name}`);
    const ref = db.collection('categories').doc(cat.id);
    batch.set(ref, { ...cat, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  for (const album of MOCK_ALBUMS) {
    console.log(`Adding album: ${album.title}`);
    const ref = db.collection('albums').doc(album.id);
    batch.set(ref, { 
      ...album, 
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      playCount: 0
    }, { merge: true });
  }

  await batch.commit();
  console.log('Seeding complete!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
