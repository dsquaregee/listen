import { db } from './src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const sampleAlbums = [
  {
    title: "Sunrise in Shankarabharanam",
    description: "An ethereal 1-hour journey through the auspicious morning raga, layered with ambient pads and cinematic textures.",
    price: 5.0,
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2069&auto=format&fit=crop",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    fullUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-ethereal-abstract-background-of-colors-and-shapes-4246-large.mp4",
    categoryId: "raga-journeys",
    moodTags: ["Morning", "Ethereal", "Calm"],
    duration: "62:14",
    isFeatured: true,
    createdAt: serverTimestamp(),
    id: "sample_1"
  },
  {
    title: "Kinetic Kalyani",
    description: "High-octane rhythmic fusion featuring electric violin and heavy mridangam grooves.",
    price: 5.0,
    coverUrl: "https://images.unsplash.com/photo-1507838596016-a94bcbc5b97c?q=80&w=2070&auto=format&fit=crop",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    fullUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-abstract-fast-and-bright-visual-loop-1153-large.mp4",
    categoryId: "fusion-accelerated",
    moodTags: ["Energetic", "Rhythmic", "Fusion"],
    duration: "58:45",
    isFeatured: false,
    createdAt: serverTimestamp(),
    id: "sample_2"
  }
];

async function seed() {
  console.log("Seeding started...");
  const albumsRef = collection(db, 'albums');
  for (const album of sampleAlbums) {
    await addDoc(albumsRef, album);
    console.log(`Added ${album.title}`);
  }
  console.log("Seeding complete.");
}

// seed(); // Run this manually or via a button in admin
