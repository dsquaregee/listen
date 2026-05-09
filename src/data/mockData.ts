import { Album, Category } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Sunrise Gold',
    slug: 'ragas',
    description: 'Ragas with Instruments',
    visualIdentity: 'bg-gradient-to-br from-[#403121] to-[#201912] border-[#D4AF37]/20 hover:border-[#D4AF37]/50',
    order: 1
  },
  {
    id: '2',
    name: 'Kinetic Fire',
    slug: 'fusion-fast',
    description: 'Fusion Fast',
    visualIdentity: 'bg-gradient-to-br from-[#3D1E1E] to-[#1E0F0F] border-red-500/20 hover:border-red-500/50',
    order: 2
  },
  {
    id: '3',
    name: 'Deep Cosmos',
    slug: 'fusion-slow',
    description: 'Fusion Slow',
    visualIdentity: 'bg-gradient-to-br from-[#1B263B] to-[#0D1117] border-blue-400/20 hover:border-blue-400/50',
    order: 3
  },
  {
    id: '4',
    name: 'Sacred Glow',
    slug: 'devotional',
    description: 'Devotional Chants',
    visualIdentity: 'bg-gradient-to-br from-[#3A2A1A] to-[#1A120A] border-orange-400/20 hover:border-orange-400/50',
    order: 4
  }
];

export const MOCK_ALBUMS: Album[] = [
  {
    id: 'a1',
    title: 'Divine Veena Resonance',
    artist: 'Jayanthi Kumaresh',
    duration: 3600,
    coverUrl: 'https://images.unsplash.com/photo-1514525253361-9f6fa183c5a6?auto=format&fit=crop&q=80&w=811',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    categoryId: '1',
    description: 'An hour of meditative Veena exploration in Raga Shankarabharanam.',
    instruments: ['Veena', 'Mridangam', 'Tanpura'],
    moodTags: ['Meditative', 'Spiritual', 'Timeless'],
    featured: true,
    isDownloaded: true,
    tier: 'premium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'a2',
    title: 'Balkan Nadaswaram',
    artist: 'Fusion Collective',
    duration: 3600,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    categoryId: '2',
    description: 'High-energy explosive fusion of Balkan brass and Carnatic Nadaswaram.',
    instruments: ['Nadaswaram', 'Saxophone', 'Drums'],
    moodTags: ['Explosive', 'Energetic', 'Kinetic'],
    isDownloaded: false,
    tier: 'free',
    createdAt: new Date().toISOString()
  },
  {
    id: 'a3',
    title: 'Cosmic Flute Textures',
    artist: 'Eternal Echoes',
    duration: 3600,
    coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=870',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    categoryId: '3',
    description: 'Deep emotional floating ambient raga textures with bamboo flute.',
    instruments: ['Bamboo Flute', 'Ambient Pads', 'Ghatam'],
    moodTags: ['Deep', 'Emotional', 'Floating', 'Immersive'],
    isDownloaded: true,
    tier: 'premium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'a4',
    title: 'Shiva Chants: Infinite Om',
    artist: 'Veda Chants',
    duration: 3600,
    coverUrl: 'https://images.unsplash.com/photo-1604881988758-f76ad2f7accf?auto=format&fit=crop&q=80&w=870',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoHlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    categoryId: '4',
    description: 'Sacred meditative mantra journey into the heart of Shiva.',
    instruments: ['Voice', 'Drums', 'Cymbals'],
    moodTags: ['Sacred', 'Peaceful', 'Transcendent'],
    isDownloaded: false,
    tier: 'free',
    createdAt: new Date().toISOString()
  }
];
