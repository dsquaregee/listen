import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Category } from '../types';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, Image as ImageIcon, Check, Loader2, DollarSign, LayoutDashboard, Database, Tags, Edit2, Trash2, Plus, X, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { user: profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'albums' | 'categories'>('albums');
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbAlbums, setDbAlbums] = useState<any[]>([]);
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);

  // Category Management State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    colorTheme: 'from-zinc-500/20 to-transparent'
  });

  // Fetch categories and albums from DB
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const catsRef = query(collection(db, 'categories'));
        const catsSnap = await getDocs(catsRef);
        const cats = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setDbCategories(cats);
        
        if (cats.length > 0 && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
        }

        const albumsRef = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
        const albumsSnap = await getDocs(albumsRef);
        const albs = albumsSnap.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        setDbAlbums(albs);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 5.0,
    categoryId: '',
    duration: '60:00',
    moodTags: '',
    isFeatured: false,
  });

  const [files, setFiles] = useState<{
    cover: File | null;
    preview: File | null;
    full: File | null;
    video: File | null;
  }>({ cover: null, preview: null, full: null, video: null });

  if (!profile?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <Database size={64} className="text-zinc-800 mb-6" />
        <h2 className="font-serif text-3xl font-bold text-zinc-600">Restricted Access</h2>
        <p className="text-zinc-500 max-w-sm mt-2">Only the chosen stewards of fusion can Enter this chamber.</p>
      </div>
    );
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum && (!files.cover || !files.preview || !files.full)) {
      toast.error("Please provide all required files (Cover, Preview, Full Audio).");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(editingAlbum ? "Updating sonic journey..." : "Uploading sonic journey...");

    try {
      let coverUrl = editingAlbum?.coverUrl || '';
      let previewUrl = editingAlbum?.previewUrl || '';
      let fullUrl = editingAlbum?.fullUrl || '';
      let videoUrl = editingAlbum?.videoUrl || '';
      const albumId = editingAlbum?.id || `album_${Date.now()}`;
      
      // 1. Upload Files if provided
      const uploadFile = async (file: File, fileName: string) => {
        const storageRef = ref(storage, `albums/${albumId}/${fileName}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      };

      const uploads = [];
      if (files.cover) uploads.push(uploadFile(files.cover, 'cover.jpg').then(url => coverUrl = url));
      if (files.preview) uploads.push(uploadFile(files.preview, 'preview.mp3').then(url => previewUrl = url));
      if (files.full) uploads.push(uploadFile(files.full, 'full.mp3').then(url => fullUrl = url));
      if (files.video) uploads.push(uploadFile(files.video, 'preview.mp4').then(url => videoUrl = url));

      if (uploads.length > 0) {
        await Promise.all(uploads);
      }

      const albumData = {
        ...formData,
        categoryId: formData.categoryId || (dbCategories.length > 0 ? dbCategories[0].id : ''),
        coverUrl,
        previewUrl,
        fullUrl,
        videoUrl,
        moodTags: typeof formData.moodTags === 'string' ? formData.moodTags.split(',').map(t => t.trim()) : formData.moodTags,
        price: Number(formData.price),
        updatedAt: serverTimestamp(),
      };

      if (editingAlbum) {
        await updateDoc(doc(db, 'albums', editingAlbum.docId), albumData);
        setDbAlbums(prev => prev.map(a => a.docId === editingAlbum.docId ? { ...a, ...albumData } : a));
        toast.success("Album updated successfully!", { id: toastId });
      } else {
        const docRef = await addDoc(collection(db, 'albums'), {
          ...albumData,
          createdAt: serverTimestamp(),
          id: albumId,
        });
        setDbAlbums(prev => [{ docId: docRef.id, ...albumData, id: albumId, createdAt: new Date() }, ...prev]);
        toast.success("Album published successfully!", { id: toastId });
      }

      setEditingAlbum(null);
      setFiles({ cover: null, preview: null, full: null, video: null });
      setFormData({
        title: '',
        description: '',
        price: 5.0,
        categoryId: dbCategories.length > 0 ? dbCategories[0].id : '',
        duration: '60:00',
        moodTags: '',
        isFeatured: false,
      });
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error(`Operation failed: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAlbum = (album: any) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      description: album.description,
      price: album.price,
      categoryId: album.categoryId,
      duration: album.duration,
      moodTags: Array.isArray(album.moodTags) ? album.moodTags.join(', ') : album.moodTags,
      isFeatured: album.isFeatured || false,
    });
    setFiles({ cover: null, preview: null, full: null, video: null });
    setActiveTab('albums');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAlbum = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this album?")) return;
    const toastId = toast.loading("Deleting album...");
    try {
      await deleteDoc(doc(db, 'albums', docId));
      setDbAlbums(prev => prev.filter(a => a.docId !== docId));
      toast.success("Album deleted", { id: toastId });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  const base64ToBlob = (base64: string, mime: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  };

  const generateAIArt = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please provide a title and description first so Gemini has context.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Gemini is imagining your sonic journey...");

    try {
      const prompt = `Create a cinematic, high-quality, photorealistic or artistic album cover art for a fusion music album titled "${formData.title}". 
        Description: ${formData.description}. 
        The style should be atmospheric, evocative, professional, and visually striking. Strictly NO text or labels on the image. Minimalist and immersive.`;

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'gemini-2.5-flash-image' }),
      });

      if (!response.ok) throw new Error('AI Art generation failed');
      const { base64 } = await response.json();

      if (base64) {
        const imageUrl = `data:image/png;base64,${base64}`;
        setAiGeneratedImage(imageUrl);
        toast.success("AI Art manifested by Gemini!", { id: toastId });
      } else {
        throw new Error("No image data received from Gemini.");
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      toast.error(`AI Art generation failed: ${error.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const useAIArt = () => {
    if (!aiGeneratedImage) return;
    try {
      const base64 = aiGeneratedImage.split(',')[1];
      const blob = base64ToBlob(base64, 'image/png');
      const file = new File([blob], `ai-art-${Date.now()}.png`, { type: 'image/png' });
      setFiles(prev => ({ ...prev, cover: file }));
      setAiGeneratedImage(null);
      toast.success("AI Art applied to the journey.");
    } catch (err) {
      toast.error("Failed to apply AI art.");
    }
  };

  const FileSection = ({ type, label, file, setFile }: { type: 'cover' | 'preview' | 'full' | 'video', label: string, file: File | null, setFile: (f: File) => void }) => {
    // @ts-ignore - Library type mismatch between react-dropzone and @types/react
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (acceptedFiles) => setFile(acceptedFiles[0]),
      multiple: false,
      accept: (type === 'cover' ? { 'image/*': [] } : (type === 'video' ? { 'video/*': [] } : { 'audio/*': [] })) as Record<string, string[]>
    });

    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
        <div 
          {...getRootProps()} 
          className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all cursor-pointer ${
            isDragActive ? 'border-gold bg-gold/5' : 'border-zinc-800 hover:border-zinc-700'
          } ${file ? 'border-green-500/50 bg-green-500/5' : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
              <Check size={18} />
              {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
            </div>
          ) : (
            <div className="text-zinc-600 flex flex-col items-center gap-1">
              {type === 'cover' ? <ImageIcon size={20} /> : <Music size={20} />}
              <span className="text-[10px] uppercase tracking-wider font-bold">Drop or Click</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(editingCategory ? "Updating category..." : "Creating category...");

    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryForm);
        setDbCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...categoryForm } : c));
        toast.success("Category updated!", { id: toastId });
      } else {
        const docRef = await addDoc(collection(db, 'categories'), categoryForm);
        const newCat = { id: docRef.id, ...categoryForm };
        setDbCategories(prev => [...prev, newCat]);
        toast.success("Category created!", { id: toastId });
      }
      setCategoryForm({ name: '', description: '', colorTheme: 'from-zinc-500/20 to-transparent' });
      setEditingCategory(null);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure? This won't delete albums but will leave them without a valid category.")) return;
    
    const toastId = toast.loading("Removing category...");
    try {
      await deleteDoc(doc(db, 'categories', id));
      setDbCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Category removed", { id: toastId });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-24 sm:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold">Admin Sanctum</h1>
            <p className="text-zinc-500">Manifest and organize immersive soundscapes.</p>
          </div>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
          <button 
            type="button"
            onClick={() => setActiveTab('albums')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'albums' ? 'bg-zinc-800 text-gold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Music size={16} />
            Albums
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'categories' ? 'bg-zinc-800 text-gold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Tags size={16} />
            Categories
          </button>
        </div>
      </div>

      {activeTab === 'albums' ? (
        <div className="space-y-12">
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-zinc-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold">{editingAlbum ? 'Edit Journey' : 'Manifest New Journey'}</h2>
                {editingAlbum && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingAlbum(null);
                      setFormData({
                        title: '',
                        description: '',
                        price: 5.0,
                        categoryId: dbCategories[0]?.id || '',
                        duration: '60:00',
                        moodTags: '',
                        isFeatured: false,
                      });
                    }}
                    className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1"
                  >
                    <X size={14} /> Cancel Edit
                  </button>
                )}
              </div>
              <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Journey Title</label>
              <input 
                id="journey-title"
                name="journey-title"
                required
                type="text" 
                placeholder="E.g. Sunrise in Shankarabharanam"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-gold outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
              <textarea 
                id="journey-description"
                name="journey-description"
                required
                rows={4}
                placeholder=" Describe the cinematic journey..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-gold outline-none transition-colors resize-none text-zinc-400 italic"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                <select 
                  id="journey-category"
                  name="journey-category"
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-gold outline-none transition-colors"
                >
                  <option value="" disabled>Select category</option>
                  {dbCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Price ($)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input 
                    id="journey-price"
                    name="journey-price"
                    type="number" 
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 focus:border-gold outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Duration</label>
                <input 
                  id="journey-duration"
                  name="journey-duration"
                  type="text" 
                  placeholder="60:00"
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-gold outline-none transition-colors font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Mood Tags</label>
                <input 
                  id="journey-mood-tags"
                  name="journey-mood-tags"
                  type="text" 
                  placeholder="Ambient, High-Energy"
                  value={formData.moodTags}
                  onChange={e => setFormData({...formData, moodTags: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-gold outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
              <input 
                id="journey-is-featured"
                name="journey-is-featured"
                type="checkbox" 
                checked={formData.isFeatured}
                onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
                className="w-5 h-5 accent-gold"
              />
              <label htmlFor="journey-is-featured" className="text-sm font-bold text-zinc-400 cursor-pointer">Featured Hero Spotlight</label>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <FileSection 
                type="cover" 
                label="1. Cover Artwork (High Res)" 
                file={files.cover} 
                setFile={(f) => setFiles({...files, cover: f})} 
              />
              
              <div className="relative">
                <button 
                  type="button"
                  disabled={isGenerating || loading}
                  onClick={generateAIArt}
                  className="w-full py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-zinc-300"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  Imagine with Gemini AI
                </button>

                {aiGeneratedImage && (
                  <div className="absolute top-full left-0 right-0 mt-4 z-20 bg-zinc-900 border border-white/10 p-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">AI Vision Preview</p>
                    <img src={aiGeneratedImage} className="w-full aspect-square rounded-lg mb-4 shadow-lg" alt="AI Generated Art" />
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={useAIArt}
                        className="flex-1 py-2 bg-gold text-black font-bold text-xs rounded-lg hover:bg-gold-light transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> Use this Art
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAiGeneratedImage(null)}
                        className="px-4 py-2 bg-white/10 text-white font-bold text-xs rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <FileSection 
              type="preview" 
              label="2. Preview Audio (2-5 min sample)" 
              file={files.preview} 
              setFile={(f) => setFiles({...files, preview: f})} 
            />
            <FileSection 
              type="video" 
              label="3. Instagram Reel Preview (MP4)" 
              file={files.video} 
              setFile={(f) => setFiles({...files, video: f})} 
            />
            <FileSection 
              type="full" 
              label="4. Full Immersive Audio (1 Hour)" 
              file={files.full} 
              setFile={(f) => setFiles({...files, full: f})} 
            />

            <button 
              disabled={loading}
              className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-gold transition-all transform active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Processing Manifest...
                </>
              ) : (
                <>
                  {editingAlbum ? <Check size={24} /> : <Upload size={24} />}
                  {editingAlbum ? 'Update Manifest' : 'Publish to Library'}
                </>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-bold">Existing Journeys</h3>
          {dbAlbums.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
              <Music size={48} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">The vault is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dbAlbums.map(album => (
                <div key={album.docId} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={album.coverUrl} className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" alt={album.title} />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate">{album.title}</h4>
                      <p className="text-xs text-zinc-500">{album.duration} • ${album.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button 
                      onClick={() => handleEditAlbum(album)}
                      className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-gold transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteAlbum(album.docId)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <form onSubmit={handleCategorySubmit} className="bg-zinc-900 shadow-xl border border-white/5 p-6 rounded-2xl space-y-6 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                {editingCategory && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: '', description: '', colorTheme: 'from-zinc-500/20 to-transparent' });
                    }}
                    className="p-1 hover:bg-white/10 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</label>
                  <input 
                    id="category-name"
                    name="category-name"
                    required
                    type="text" 
                    value={categoryForm.name}
                    onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                    placeholder="E.g. Ambient Ragas"
                    className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-gold outline-none transition-colors text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    id="category-description"
                    name="category-description"
                    required
                    rows={3}
                    value={categoryForm.description}
                    onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                    placeholder="Short description for the bento section..."
                    className="w-full bg-black border border-white/10 rounded-xl p-3 focus:border-gold outline-none transition-colors text-sm resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Theme Atmosphere</label>
                    <div className="flex items-center gap-2">
                       {(() => {
                         const match = categoryForm.colorTheme.match(/from-\[([^\]]+)\]/);
                         const hex = match ? match[1] : (categoryForm.colorTheme.includes('zinc') ? '#71717a' : '#d4af37');
                         return (
                           <>
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hex }} />
                             <span className="text-[10px] font-mono text-zinc-500">{hex}</span>
                           </>
                         )
                       })()}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Amber', hex: '#f59e0b' },
                      { name: 'Red', hex: '#ef4444' },
                      { name: 'Blue', hex: '#3b82f6' },
                      { name: 'Emerald', hex: '#10b981' },
                      { name: 'Violet', hex: '#8b5cf6' },
                      { name: 'Pink', hex: '#ec4899' },
                      { name: 'Zinc', hex: '#71717a' },
                    ].map((p) => {
                      const isActive = categoryForm.colorTheme.includes(p.hex);
                      return (
                        <button
                          key={p.hex}
                          type="button"
                          onClick={() => setCategoryForm({...categoryForm, colorTheme: `from-[${p.hex}]/20 to-transparent`})}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${isActive ? 'border-gold scale-110 shadow-lg shadow-gold/20' : 'border-white/5 hover:border-white/20'}`}
                          style={{ backgroundColor: p.hex }}
                          title={p.name}
                        />
                      );
                    })}
                    <div className="relative group">
                      <input 
                        id="category-color-picker"
                        name="category-color-picker"
                        type="color"
                        onChange={(e) => setCategoryForm({...categoryForm, colorTheme: `from-[${e.target.value}]/20 to-transparent`})}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <button 
                        type="button"
                        className="w-8 h-8 rounded-lg border-2 border-dashed border-white/20 bg-zinc-800/50 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:border-white/40 transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <input 
                    type="hidden"
                    value={categoryForm.colorTheme}
                  />
                  <p className="text-[9px] text-zinc-600 font-medium italic">This frequency will define the background atmosphere for this collection.</p>
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full py-3 bg-gold text-black font-bold rounded-xl hover:bg-gold-light transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (editingCategory ? <Check size={18} /> : <Plus size={18} />)}
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            {dbCategories.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-white/5 border-dashed">
                <Tags size={32} className="mx-auto text-zinc-800 mb-2" />
                <p className="text-zinc-600">No categories found in the database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {dbCategories.map(cat => (
                  <div key={cat.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between group gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${cat.colorTheme} border border-white/5 flex-shrink-0`} />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate">{cat.name}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-1">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryForm({
                            name: cat.name,
                            description: cat.description,
                            colorTheme: cat.colorTheme
                          });
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
