import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc as firestoreAddDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AmbienceScene, Album } from '../types';
import { 
  Plus, Edit2, Trash2, X, Check, 
  Music, Image as ImageIcon, Sparkles, Loader2,
  Tag, AlignLeft, Activity, Search, RefreshCw, Layers, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function SceneManager() {
  const [scenes, setScenes] = useState<AmbienceScene[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingMagic, setIsGeneratingMagic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<AmbienceScene, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    albumIds: [],
    visualIdentity: {
      fromColor: '#4f46e5',
      toColor: '#7c3aed',
      blur: 40,
      opacity: 0.2
    },
    tags: [],
    isPrebuilt: true
  });

  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const scenesQ = query(collection(db, 'ambience_scenes'), orderBy('name', 'asc'));
      const scenesSnapshot = await getDocs(scenesQ);
      const fetchedScenes: AmbienceScene[] = [];
      scenesSnapshot.forEach((doc) => {
        fetchedScenes.push({ id: doc.id, ...doc.data() } as AmbienceScene);
      });
      setScenes(fetchedScenes);

      const albumsQ = query(collection(db, 'albums'), orderBy('title', 'asc'));
      const albumsSnapshot = await getDocs(albumsQ);
      const fetchedAlbums: Album[] = [];
      albumsSnapshot.forEach((doc) => {
        fetchedAlbums.push({ id: doc.id, ...doc.data() } as Album);
      });
      setAlbums(fetchedAlbums);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'ambience_scenes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await setDoc(doc(db, 'ambience_scenes', id), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      resetForm();
      fetchInitialData();
      toast.success('Ambience scene manifested.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ambience_scenes');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const sceneRef = doc(db, 'ambience_scenes', id);
      await updateDoc(sceneRef, {
        ...formData
      });
      setEditingId(null);
      fetchInitialData();
      toast.success('Spectrum recalibrated.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ambience_scenes/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scene?')) return;
    try {
      await deleteDoc(doc(db, 'ambience_scenes', id));
      fetchInitialData();
      toast.success('Scene dissolved.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `ambience_scenes/${id}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      albumIds: [],
      visualIdentity: {
        fromColor: '#4f46e5',
        toColor: '#7c3aed',
        blur: 40,
        opacity: 0.2
      },
      tags: [],
      isPrebuilt: true
    });
  };

  const startEdit = (scene: AmbienceScene) => {
    // Check if visualIdentity is already an object (new format) or string (old format)
    const visual = typeof scene.visualIdentity === 'string' 
      ? { fromColor: '#4f46e5', toColor: '#7c3aed', blur: 40, opacity: 0.2 } // Default for old data
      : scene.visualIdentity;

    setFormData({
      name: scene.name,
      description: scene.description,
      albumIds: scene.albumIds || [],
      visualIdentity: visual,
      tags: scene.tags || [],
      isPrebuilt: scene.isPrebuilt ?? true
    });
    setEditingId(scene.id);
  };

  const toggleAlbum = (albumId: string) => {
    setFormData(prev => ({
      ...prev,
      albumIds: prev.albumIds.includes(albumId)
        ? prev.albumIds.filter(id => id !== albumId)
        : [...prev.albumIds, albumId]
    }));
  };

  const allTags = Array.from(new Set(scenes.flatMap(s => s.tags || []))).sort();

  const filteredScenes = scenes.filter(scene => {
    const matchesSearch = scene.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         scene.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || (scene.tags && scene.tags.includes(selectedTag));
    const matchesAlbum = !selectedAlbumId || (scene.albumIds && scene.albumIds.includes(selectedAlbumId));
    
    return matchesSearch && matchesTag && matchesAlbum;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-serif font-bold italic">Ambience Scenes</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Curate multi-album atmospheric spectra</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search spectra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all w-48 md:w-64"
            />
          </div>
          <button 
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Create Scene
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-white/40" />
          <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest">Filters:</span>
        </div>
        
        {/* Tag Filter */}
        <select 
          value={selectedTag || ''}
          onChange={(e) => setSelectedTag(e.target.value || null)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest focus:outline-none focus:border-primary/50"
        >
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        {/* Album Filter */}
        <select 
          value={selectedAlbumId || ''}
          onChange={(e) => setSelectedAlbumId(e.target.value || null)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest focus:outline-none focus:border-primary/50"
        >
          <option value="">All Music</option>
          {albums.map(album => (
            <option key={album.id} value={album.id}>{album.title}</option>
          ))}
        </select>

        {(selectedTag || selectedAlbumId || searchQuery) && (
          <button 
            onClick={() => {
              setSelectedTag(null);
              setSelectedAlbumId(null);
              setSearchQuery('');
            }}
            className="text-[10px] uppercase font-bold text-primary hover:text-white transition-colors tracking-widest flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        )}

        <div className="ml-auto text-[10px] font-mono text-white/20 uppercase tracking-widest">
          {filteredScenes.length} Result{filteredScenes.length !== 1 ? 's' : ''}
        </div>
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
                       <Layers className="w-5 h-5 text-primary" />
                       {editingId ? 'Recalibrate Spectrum' : 'Manifest New Atmosphere'}
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
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                          <Tag className="w-3 h-3" /> Scene Name
                        </label>
                        <input 
                          required
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                          placeholder="e.g. Morning Prayer"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                          <AlignLeft className="w-3 h-3" /> Description
                        </label>
                        <textarea 
                          required
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-colors min-h-[100px]"
                          placeholder="Describe the sonic journey..."
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" /> Visual Identity Configuration
                        </label>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] text-white/40 uppercase">Start Color</label>
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                value={formData.visualIdentity.fromColor}
                                onChange={e => setFormData({
                                  ...formData, 
                                  visualIdentity: { ...formData.visualIdentity, fromColor: e.target.value }
                                })}
                                className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={formData.visualIdentity.fromColor}
                                onChange={e => setFormData({
                                  ...formData, 
                                  visualIdentity: { ...formData.visualIdentity, fromColor: e.target.value }
                                })}
                                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-[10px] font-mono focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] text-white/40 uppercase">End Color</label>
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                value={formData.visualIdentity.toColor}
                                onChange={e => setFormData({
                                  ...formData, 
                                  visualIdentity: { ...formData.visualIdentity, toColor: e.target.value }
                                })}
                                className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={formData.visualIdentity.toColor}
                                onChange={e => setFormData({
                                  ...formData, 
                                  visualIdentity: { ...formData.visualIdentity, toColor: e.target.value }
                                })}
                                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-[10px] font-mono focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-white/40 uppercase">Atmospheric Blur</label>
                              <span className="text-[9px] font-mono text-primary">{formData.visualIdentity.blur}px</span>
                            </div>
                            <input 
                              type="range" min="0" max="200"
                              value={formData.visualIdentity.blur}
                              onChange={e => setFormData({
                                ...formData, 
                                visualIdentity: { ...formData.visualIdentity, blur: parseInt(e.target.value) }
                              })}
                              className="w-full accent-primary bg-white/5 h-1 rounded-full appearance-none cursor-pointer"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-white/40 uppercase">Intensity (Opacity)</label>
                              <span className="text-[9px] font-mono text-primary">{Math.round(formData.visualIdentity.opacity * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="1" step="0.01"
                              value={formData.visualIdentity.opacity}
                              onChange={e => setFormData({
                                ...formData, 
                                visualIdentity: { ...formData.visualIdentity, opacity: parseFloat(e.target.value) }
                              })}
                              className="w-full accent-primary bg-white/5 h-1 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <div 
                          className="mt-4 h-20 rounded-2xl border border-white/10 relative overflow-hidden"
                          style={{
                            background: `linear-gradient(to bottom right, ${formData.visualIdentity.fromColor}, ${formData.visualIdentity.toColor})`,
                            boxShadow: `0 0 ${formData.visualIdentity.blur}px ${formData.visualIdentity.fromColor}${Math.round(formData.visualIdentity.opacity * 255).toString(16).padStart(2, '0')}`
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Real-time Preview</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                          <Music className="w-3 h-3" /> Assigned Universe Albums
                        </label>
                        <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                           {albums.map(album => (
                             <button
                               key={album.id}
                               type="button"
                               onClick={() => toggleAlbum(album.id)}
                               className={cn(
                                 "w-full flex items-center gap-3 p-2 rounded-xl border transition-all text-left",
                                 formData.albumIds.includes(album.id) 
                                   ? "bg-primary/10 border-primary/30" 
                                   : "bg-white/[0.02] border-white/5 hover:border-white/10"
                               )}
                             >
                                <img src={album.coverUrl} className="w-8 h-8 rounded bg-white/5 object-cover" />
                                <div className="min-w-0">
                                   <p className="text-[10px] font-bold truncate">{album.title}</p>
                                   <p className="text-[8px] text-white/20 uppercase tracking-widest">{album.artist}</p>
                                </div>
                                {formData.albumIds.includes(album.id) && <Check className="ml-auto w-3 h-3 text-primary" />}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                           <Tag className="w-3 h-3" /> Core Spectrum Tags
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary transition-colors"
                            placeholder="Add a tag..."
                          />
                          <button 
                            type="button"
                            onClick={addTag}
                            className="px-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
                          >
                             <Plus className="w-4 h-4 text-primary" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-4 rounded-2xl bg-black/20 border border-white/5">
                           {formData.tags.map(tag => (
                             <span 
                               key={tag} 
                               className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary"
                             >
                               {tag}
                               <button 
                                 type="button" 
                                 onClick={() => removeTag(tag)}
                                 className="p-1 hover:bg-primary/20 rounded-full transition-colors"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                             </span>
                           ))}
                           {formData.tags.length === 0 && (
                             <span className="text-[9px] text-white/20 italic uppercase tracking-tighter">No categories assigned yet</span>
                           )}
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
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-2.5 rounded-full bg-primary text-black text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingId ? 'Update Spectrum' : 'Manifest Scene'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenes.map((scene) => (
              <div 
                key={scene.id}
                onClick={() => startEdit(scene)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    startEdit(scene);
                  }
                }}
                className={cn(
                  "group relative p-6 rounded-[32px] transition-all overflow-hidden border text-left w-full cursor-pointer outline-none focus:ring-2 focus:ring-primary/40",
                  scene.id === editingId 
                    ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-[0_0_40px_rgba(20,184,166,0.15)] scale-[1.02]" 
                    : "bg-white/[0.02] border-white/5 hover:border-primary/20 hover:bg-white/[0.04]"
                )}
              >
                {scene.visualIdentity && typeof scene.visualIdentity === 'object' ? (
                  <div 
                    className={cn(
                      "absolute inset-0 transition-opacity",
                      scene.id === editingId ? "opacity-30" : "opacity-10 group-hover:opacity-20"
                    )}
                    style={{ 
                      background: `linear-gradient(to bottom right, ${scene.visualIdentity.fromColor}, ${scene.visualIdentity.toColor})`,
                      filter: `blur(${scene.visualIdentity.blur}px)`
                    }} 
                  />
                ) : (
                  <div className={cn("absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br", scene.visualIdentity as any)} />
                )}
                
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors",
                      scene.id === editingId ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10"
                    )}>
                       <Layers className={cn("w-6 h-6", scene.id === editingId ? "text-white" : "text-primary")} />
                    </div>
                    <div className="flex gap-1 items-center">
                      {scene.id === editingId && (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-primary mr-2 animate-pulse flex items-center gap-1">
                          <Activity size={8} /> Editing
                        </span>
                      )}
                      <div className="flex gap-1">
                        <div className="p-2 rounded-full bg-white/5 text-white/40 group-hover:text-white transition-colors">
                          <Edit2 size={14} />
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(scene.id);
                          }} 
                          className="p-2 rounded-full hover:bg-red-400/10 text-red-400/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold italic">{scene.name}</h4>
                    <p className="text-xs text-white/40 line-clamp-2 mt-1">{scene.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                     {scene.tags?.map(tag => (
                       <span key={tag} className="text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/30">{tag}</span>
                     ))}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-white/20">{scene.albumIds?.length || 0} Albums linked</span>
                    {scene.isPrebuilt && <span className="text-[10px] text-primary/60 italic">Core Spectrum</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {scenes.length === 0 && !isAdding && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                <Layers className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Atmosphere Void Detected</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
