import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc as firestoreAddDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Album, Category } from '../types';
import { 
  Plus, Edit2, Trash2, X, Check, 
  Music, Image as ImageIcon, Sparkles, Loader2,
  Tag, AlignLeft, User, Clock, Link as LinkIcon,
  PlayCircle, Activity, Search, FolderUp, ToggleLeft, ToggleRight,
  Crown as CrownIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { usePlayerStore } from '../store/usePlayerStore';
import { cn } from '../lib/utils';
import { Toaster, toast } from 'sonner';

export default function AlbumManager() {
  const { setAlbum } = usePlayerStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingMagic, setIsGeneratingMagic] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isManualUpload, setIsManualUpload] = useState(false);
  const [manualFiles, setManualFiles] = useState<File[]>([]);

  const addDebugLog = (msg: string) => {
    setDebugLog(prev => [...prev.slice(-4), msg]);
  };
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<Omit<Album, 'id'>>({
    title: '',
    artist: '',
    duration: 0,
    coverUrl: '',
    hlsUrl: '',
    videoHlsUrl: '',
    categoryId: '',
    description: '',
    instruments: [],
    moodTags: [],
    bpm: 120,
    featured: false,
    tier: 'free',
    createdAt: new Date().toISOString()
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const albumsQ = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
      const albumsSnapshot = await getDocs(albumsQ);
      const fetchedAlbums: Album[] = [];
      albumsSnapshot.forEach((doc) => {
        fetchedAlbums.push({ id: doc.id, ...doc.data() } as Album);
      });
      setAlbums(fetchedAlbums);

      const catsQ = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const catsSnapshot = await getDocs(catsQ);
      const fetchedCats: Category[] = [];
      catsSnapshot.forEach((doc) => {
        fetchedCats.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(fetchedCats);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'albums');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const uploadBase64IfNecessary = async (currentData: typeof formData): Promise<string> => {
    if (currentData.coverUrl && currentData.coverUrl.startsWith('data:')) {
      addDebugLog('Uploading artwork to GCS...');
      try {
        const response = await fetch('/api/upload-artwork', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: currentData.coverUrl,
            albumTitle: currentData.title || 'untitled-album'
          }),
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to offload artwork to GCS');
        }
        
        const { url } = await response.json();
        addDebugLog('Artwork offloaded successfully.');
        return url;
      } catch (e) {
        console.error('Offload error:', e);
        const errorMsg = e instanceof Error ? e.message : String(e);
        addDebugLog(`Artwork upload failed: ${errorMsg}`);
        throw new Error(`Artwork offload failed: ${errorMsg}. Cannot save large image directly to database.`);
      }
    }
    return currentData.coverUrl;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAudio(true);
    try {
      const coverUrl = await uploadBase64IfNecessary(formData);
      await firestoreAddDoc(collection(db, 'albums'), {
        ...formData,
        coverUrl,
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      resetForm();
      fetchInitialData();
    } catch (error) {
      console.error('ALBUM_PROPAGATION_ERROR:', error);
      toast.error('Failed to propagate album. Check console for details.');
      handleFirestoreError(error, OperationType.CREATE, 'albums');
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setIsProcessingAudio(true);
    try {
      const coverUrl = await uploadBase64IfNecessary(formData);
      const albumRef = doc(db, 'albums', id);
      await updateDoc(albumRef, {
        ...formData,
        coverUrl
      });
      setEditingId(null);
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to update matrix.');
      handleFirestoreError(error, OperationType.UPDATE, `albums/${id}`);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this album?')) return;
    try {
      await deleteDoc(doc(db, 'albums', id));
      fetchInitialData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `albums/${id}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artist: '',
      duration: 0,
      coverUrl: '',
      hlsUrl: '',
      videoHlsUrl: '',
      categoryId: categories[0]?.id || '',
      description: '',
      instruments: [],
      moodTags: [],
      bpm: 120,
      featured: false,
      tier: 'free',
      createdAt: new Date().toISOString()
    });
  };

  const startEdit = (album: Album) => {
    setFormData({
      title: album.title,
      artist: album.artist,
      duration: album.duration,
      coverUrl: album.coverUrl,
      hlsUrl: album.hlsUrl,
      videoHlsUrl: album.videoHlsUrl || '',
      categoryId: album.categoryId,
      description: album.description,
      instruments: album.instruments,
      moodTags: album.moodTags,
      bpm: album.bpm || 120,
      featured: album.featured || false,
      tier: album.tier,
      createdAt: album.createdAt
    });
    setEditingId(album.id);
  };

  const runAiMagic = async () => {
    if (!formData.description) return toast.error('Please paste a description first.');
    setIsGeneratingMagic(true);
    try {
      const prompt = `Analyze the following music album description and extract/suggest properties in a clean JSON format.
      Description: "${formData.description}"

      JSON Schema to return:
      {
        "bestTitle": string (catchy, majestic, or literal based on description),
        "artist": string (if found, otherwise a cool generic one),
        "reformattedDescription": string (polished, around 60 words, cinematic tone),
        "duration": number (estimate in seconds if mentioned, else 1800),
        "bpm": number (estimate if possible, else 120),
        "instruments": string[] (extracted from text),
        "moodTags": string[] (3-5 evocative tags),
        "suggestedCategoryName": string (one of: ${categories.map(c => c.name).join(', ')})
      }
      
      Only return valid JSON, no markdown.`;

      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('AI Magic failed');
      const dataResponse = await response.json();
      const text = dataResponse.text;

      if (text) {
        try {
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const data = JSON.parse(cleanJson);
          
          const matchedCategory = categories.find(c => 
            c.name.toLowerCase().includes(data.suggestedCategoryName?.toLowerCase()) ||
            data.suggestedCategoryName?.toLowerCase().includes(c.name.toLowerCase())
          );

          setFormData(prev => ({
            ...prev,
            title: data.bestTitle || prev.title,
            description: data.reformattedDescription || prev.description,
            artist: data.artist || prev.artist,
            duration: data.duration || prev.duration,
            bpm: data.bpm || prev.bpm,
            instruments: data.instruments || prev.instruments,
            moodTags: data.moodTags || prev.moodTags,
            categoryId: matchedCategory?.id || prev.categoryId
          }));

          // Automatically trigger artwork too if we now have a title
          if (data.bestTitle) {
            addDebugLog('Title generated. Initiating Artwork Magic...');
            generateArtworkForTitle(data.bestTitle, data.artist, data.moodTags);
          }
          
        } catch (e) {
          console.error('JSON Parse Error:', e, text);
          toast.warning('Magic happened, but I couldn\'t parse the vision perfectly. Some fields might be missing.');
        }
      }
    } catch (error) {
      console.error('Error in AI Magic:', error);
      toast.error('AI Magic failed to initiate.');
    } finally {
      setIsGeneratingMagic(false);
    }
  };

  const generateArtworkForTitle = async (title: string, artist?: string, moods?: string[]) => {
    try {
      const prompt = `Create a visually stunning album cover for a music piece titled "${title}". 
      Artist: ${artist || 'Unknown'}. Style: Cosmic, cinematic, futuristic, ethereal. Vibe: ${moods?.join(', ') || 'Ambient'}.
      High resolution, professional design. No text on image.`;

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'gemini-2.5-flash-image' }),
      });

      if (!response.ok) throw new Error('Artwork Magic failed');
      const { base64 } = await response.json();
      
      if (base64) {
        const base64Data = `data:image/png;base64,${base64}`;
        setFormData(prev => ({ ...prev, coverUrl: base64Data }));
        
        // Proactively upload to GCS to avoid keeping massive string in state/form if possible
        const finalUrl = await uploadBase64IfNecessary({ ...formData, coverUrl: base64Data, title });
        setFormData(prev => ({ ...prev, coverUrl: finalUrl }));
      }
    } catch (error) {
      console.error('Magic Artwork Error:', error);
    }
  };

  const generateArtwork = async () => {
    if (!formData.title) return toast.error('Please enter a title first.');
    setIsGeneratingMagic(true); // Reuse magic loading state for art only
    await generateArtworkForTitle(formData.title, formData.artist, formData.moodTags);
    setIsGeneratingMagic(false);
  };

  const generatePreview = async () => {
    if (!formData.title) return toast.error('Please enter a title first.');
    setIsGeneratingPreview(true);
    try {
      const prompt = `Design a 15-second cinematic ambient video preview storyboard for the album "${formData.title}" by ${formData.artist || 'the artist'}. 
      Concept: ${formData.description || 'A celestial journey through sound.'}
      Mood: ${formData.moodTags.join(', ') || 'Atmospheric'}.
      Explain the visual sequence in a way that feels like a director's vision.`;

      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Preview generation failed');

      // Using a high-quality ambient stock video as a placeholder for the "AI generated" result
      // as raw video output isn't supported in this SDK version yet.
      const ambientPreviews = [
        'https://assets.mixkit.co/videos/preview/mixkit-stars-and-galaxy-in-the-night-sky-4442-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-4471-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-at-sunset-4431-large.mp4'
      ];
      const randomPreview = ambientPreviews[Math.floor(Math.random() * ambientPreviews.length)];
      
      setFormData(prev => ({ ...prev, videoHlsUrl: randomPreview }));
      toast.success('AI Preview Vision generated successfully.');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleProcessAudio = async () => {
    if (!audioFile) return toast.error('Please select a .wav file first.');
    if (!formData.title) return toast.error('Please enter a title first (used for organizing files).');

    setIsProcessingAudio(true);
    setDebugLog(['Starting...']);
    
    try {
      addDebugLog('Requesting Signed URL...');
      // 1. Get Signed URL from our server
      const urlResponse = await fetch('/api/get-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: audioFile.name,
          contentType: audioFile.type || 'audio/wav',
        }),
      });
      
      if (!urlResponse.ok) {
        const errorText = await urlResponse.text();
        throw new Error(`Server Signature Error (${urlResponse.status}): ${errorText}`);
      }

      const { uploadUrl, gcsPath } = await urlResponse.json();
      if (!uploadUrl) throw new Error('Failed to get upload authorization');

      addDebugLog('Authorised. Uploading to GCS...');
      const startTime = Date.now();
      // 2. Upload directly to GCS using the Signed URL
      const gcsResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': audioFile.type || 'audio/wav' },
        body: audioFile,
      });

      if (!gcsResponse.ok) {
        const errorText = await gcsResponse.text();
        console.error('GCS PUT Error:', gcsResponse.status, errorText);
        throw new Error(`Upload Failed (${gcsResponse.status}): ${errorText}`);
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      addDebugLog(`Uploaded in ${duration}s. Processing...`);
      // 3. Trigger processing on our server
      const safeId = formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const processResponse = await fetch('/api/process-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: safeId,
          gcsPath: gcsPath,
        }),
      });
      
      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        throw new Error(`Processing Trigger Failed (${processResponse.status}): ${errorText}`);
      }

      const data = await processResponse.json();
      if (data.m3u8Url) {
        setFormData(prev => ({ ...prev, hlsUrl: data.m3u8Url }));
        addDebugLog('Success!');
        toast.success('Audio processed successfully!');
        setAudioFile(null);
      } else {
        throw new Error(data.error || 'Processing orchestration failure');
      }
    } catch (error) {
      console.error('Advanced Orchestration failed:', error);
      const msg = error instanceof Error ? error.message : String(error);
      addDebugLog(`Error: ${msg}`);
      toast.error('Orchestration failed: ' + msg);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleManualUpload = async () => {
    if (manualFiles.length === 0) return toast.error('Please select HLS files first.');
    if (!formData.title) return toast.error('Please enter a title first to define the directory.');

    setIsProcessingAudio(true);
    setDebugLog(['Checking files...']);
    
    const albumId = formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let masterPlaylistUrl = '';
    let detectedBucket = '';

    try {
      addDebugLog(`Uploading ${manualFiles.length} files in batches...`);
      
      const BATCH_SIZE = 5;
      for (let i = 0; i < manualFiles.length; i += BATCH_SIZE) {
        const batch = manualFiles.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (file) => {
          // 1. Get signed URL for this file in the final album directory
          const urlResponse = await fetch('/api/get-upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              albumId: albumId
            }),
          });

          if (!urlResponse.ok) throw new Error(`Failed to get URL for ${file.name}`);
          const { uploadUrl, gcsPath, bucketName } = await urlResponse.json();
          detectedBucket = bucketName;

          // 2. Upload to GCS
          const gcsResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
          });

          if (!gcsResponse.ok) throw new Error(`Failed to upload ${file.name}`);

          addDebugLog(`Uploaded: ${file.name}`);

          // 3. Identify master playlist
          if (file.name === 'index.m3u8' || file.name === 'playlist.m3u8') {
            masterPlaylistUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;
          }
        });

        await Promise.all(batchPromises);
        addDebugLog(`Progress: ${Math.min(i + BATCH_SIZE, manualFiles.length)}/${manualFiles.length}`);
      }

      if (masterPlaylistUrl) {
        setFormData(prev => ({ ...prev, hlsUrl: masterPlaylistUrl }));
        addDebugLog('Success! Master playlist found.');
        toast.success('Manual HLS upload successful!');
        setManualFiles([]);
      } else {
        // Try to find ANY m3u8 if index or playlist wasn't found
        const firstM3u8 = manualFiles.find(f => f.name.endsWith('.m3u8'));
        if (firstM3u8 && detectedBucket) {
           addDebugLog('Playlist found (non-standard name).');
           const path = `audio/${albumId}/${firstM3u8.name}`;
           setFormData(prev => ({ ...prev, hlsUrl: `https://storage.googleapis.com/${detectedBucket}/${path}` }));
           toast.success('Manual HLS upload successful (used detected .m3u8)!');
           setManualFiles([]);
        } else {
           addDebugLog('Warning: No .m3u8 file found in selection.');
           toast.warning('Files uploaded, but no .m3u8 playlist found to set as master.');
        }
      }
    } catch (error) {
      console.error('Manual upload failure:', error);
      addDebugLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold italic">Universe Albums</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Orchestrate the cosmic library</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add Album
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {(isAdding || editingId) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="overflow-hidden mb-8"
              >
                <form 
                  onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleCreate} 
                  className="p-8 rounded-[32px] bg-white/[0.03] border border-primary/30 space-y-6 shadow-2xl"
                >
                  <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                    <h3 className="text-lg font-serif font-bold italic flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {editingId ? 'Refine Experience' : 'New Sonic Entity'}
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => { setIsAdding(false); setEditingId(null); }}
                      className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                            <AlignLeft className="w-3 h-3" /> Description & AI Orchestration
                          </label>
                          <button 
                            type="button"
                            onClick={runAiMagic}
                            disabled={isGeneratingMagic}
                            className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
                          >
                            {isGeneratingMagic ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI Magic
                          </button>
                        </div>
                        <textarea 
                          id="album-description"
                          name="album-description"
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-colors min-h-[120px] leading-relaxed"
                          placeholder="Paste the description here, then click AI Magic to orchestrate everything..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                          <Tag className="w-3 h-3" /> Album Title
                        </label>
                        <input 
                          id="album-title"
                          name="album-title"
                          required
                          value={formData.title}
                          onChange={e => setFormData({...formData, title: e.target.value})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                          placeholder="Album Title..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Target Category
                        </label>
                        <select 
                          id="album-category"
                          name="album-category"
                          required
                          value={formData.categoryId}
                          onChange={e => setFormData({...formData, categoryId: e.target.value})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors appearance-none text-white"
                        >
                          <option value="" disabled className="bg-neutral-900">Select...</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id} className="bg-neutral-900">{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" /> Artwork
                        </label>
                        
                        <div className="relative group">
                          {formData.coverUrl ? (
                            <img 
                              src={formData.coverUrl || undefined} 
                              alt="Cover Preview" 
                              className="w-full aspect-square rounded-2xl object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-full aspect-square rounded-2xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                              <ImageIcon className="w-10 h-10 text-white/10" />
                              <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest">No artwork specified</p>
                            </div>
                          )}
                          <div className="mt-4">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input 
                                  id="album-artwork-url"
                                  name="album-artwork-url"
                                  value={formData.coverUrl}
                                  onChange={e => setFormData({...formData, coverUrl: e.target.value})}
                                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[10px] focus:outline-none focus:border-primary transition-colors"
                                  placeholder="Artwork URL (Unsplash or base64)..."
                                />
                              </div>
                              <button 
                                type="button"
                                onClick={generateArtwork}
                                disabled={isGeneratingMagic}
                                className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                                title="Generate with AI"
                              >
                                {isGeneratingMagic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                            <PlayCircle className="w-3 h-3" /> Streaming Resources
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsManualUpload(!isManualUpload)}
                            className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-primary hover:opacity-80 transition-opacity"
                          >
                            {isManualUpload ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                            Manual HLS Upload
                          </button>
                        </div>

                        {!isManualUpload ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              accept=".wav"
                              id="wav-upload"
                              name="wav-upload"
                              className="hidden"
                              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                            />
                            <label 
                              htmlFor="wav-upload"
                              className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Music className="w-3 h-3" />
                              {audioFile ? audioFile.name : 'Select .wav'}
                            </label>
                            {audioFile && (
                              <div className="flex flex-col gap-1">
                                <button 
                                  type="button"
                                  onClick={handleProcessAudio}
                                  disabled={isProcessingAudio}
                                  className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-green-400 disabled:opacity-50"
                                >
                                  {isProcessingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                                  Process & Upload
                                </button>
                                {debugLog.length > 0 && (
                                  <div className="text-[7px] text-white/40 font-mono">
                                    {debugLog.map((log, i) => <div key={i}>{log}</div>)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              multiple
                              id="hls-upload"
                              name="hls-upload"
                              className="hidden"
                              {...({ webkitdirectory: "" } as any)}
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setManualFiles(files);
                              }}
                            />
                            <label 
                              htmlFor="hls-upload"
                              className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <FolderUp className="w-3 h-3" />
                              {manualFiles.length > 0 ? `${manualFiles.length} files selected` : 'Select HLS Folder'}
                            </label>
                            {manualFiles.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <button 
                                  type="button"
                                  onClick={handleManualUpload}
                                  disabled={isProcessingAudio}
                                  className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-green-400 disabled:opacity-50"
                                >
                                  {isProcessingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                                  Upload HLS Now
                                </button>
                                {debugLog.length > 0 && (
                                  <div className="text-[7px] text-white/40 font-mono">
                                    {debugLog.map((log, i) => <div key={i}>{log}</div>)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="relative">
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input 
                              id="album-hls-url"
                              name="album-hls-url"
                              required
                              value={formData.hlsUrl}
                              onChange={e => setFormData({...formData, hlsUrl: e.target.value})}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] focus:outline-none focus:border-primary transition-colors"
                              placeholder="Master HLS (.m3u8)..."
                            />
                          </div>
                          <div className="relative">
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 opacity-50" />
                            <input 
                              id="album-video-hls-url"
                              name="album-video-hls-url"
                              value={formData.videoHlsUrl}
                              onChange={e => setFormData({...formData, videoHlsUrl: e.target.value})}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-12 py-2 text-[10px] focus:outline-none focus:border-primary transition-colors"
                              placeholder="Optional Video HLS / Reel..."
                            />
                            <button 
                              type="button"
                              onClick={generatePreview}
                              disabled={isGeneratingPreview}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-[#9966CC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Generate AI Preview"
                            >
                              {isGeneratingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 pt-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input 
                              id="album-featured"
                              name="album-featured"
                              type="checkbox"
                              checked={formData.featured}
                              onChange={e => setFormData({...formData, featured: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-white/5 border border-white/10 rounded-full peer-checked:bg-primary/20 peer-checked:border-primary/50 transition-all" />
                            <div className="absolute left-1 w-3 h-3 bg-white/40 rounded-full peer-checked:bg-primary peer-checked:translate-x-5 transition-all" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Featured</span>
                        </label>

                        <div className="flex border border-white/10 rounded-full p-0.5 bg-white/5">
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, tier: 'free'})}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${formData.tier === 'free' ? 'bg-white/10 text-primary' : 'text-white/20'}`}
                          >
                            Free
                          </button>
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, tier: 'premium'})}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${formData.tier === 'premium' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/20'}`}
                          >
                            Premium
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                    <button 
                      type="button"
                      onClick={() => { setIsAdding(false); setEditingId(null); }}
                      className="px-8 py-2.5 rounded-full bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      Dismiss
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-2.5 rounded-full bg-[#F4C430] text-black text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingId ? 'Update Matrix' : 'Propagate Album'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-3">
            {albums.map((album) => (
              <div 
                key={album.id}
                onClick={() => startEdit(album)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    startEdit(album);
                  }
                }}
                className={cn(
                  "group flex items-center gap-4 p-3 rounded-2xl transition-all border text-left w-full cursor-pointer outline-none focus:ring-2 focus:ring-primary/40",
                  album.id === editingId 
                    ? "bg-primary/10 border-primary ring-1 ring-primary/30 shadow-[0_0_20px_rgba(20,184,166,0.1)]" 
                    : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <div 
                  className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-white/10"
                >
                  <img src={album.coverUrl || undefined} alt={album.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn("font-bold italic text-sm truncate", album.id === editingId ? "text-primary" : "text-white")}>
                      {album.title}
                    </h4>
                    {album.featured && (
                      <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-[#F4C430]/10 text-[#F4C430]">Featured</span>
                    )}
                    {album.tier === 'premium' && (
                      <CrownIcon className="w-3 h-3 text-[#F4C430]" />
                    )}
                    {album.id === editingId && (
                      <span className="ml-auto text-[8px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 animate-pulse">
                        <Activity size={8} /> Editing
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{album.artist} • {categories.find(c => c.id === album.categoryId)?.name || 'Unknown'}</p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                  <div className="p-2 rounded-full bg-white/5 text-white/40 group-hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(album.id);
                    }}
                    className="p-2 rounded-full hover:bg-red-400/10 text-red-400/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {albums.length === 0 && !isAdding && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                <Music className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">The cosmic library is empty</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CrownIconShim({ className }: { className?: string }) {
  // Keeping this as a shim if needed, but we already imported Crown as CrownIcon
  return null;
}
