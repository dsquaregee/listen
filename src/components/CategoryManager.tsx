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
import { Category } from '../types';
import { 
  Plus, Edit2, Trash2, X, Check, 
  Layers, Palette, Tag, AlignLeft, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

const PRESET_VISUALS = [
  'bg-gradient-to-br from-[#403121] to-[#201912] border-primary/20 hover:border-primary/50',
  'bg-gradient-to-br from-[#1A1A00] to-[#0A0A02] border-primary/20 hover:border-primary/50',
  'bg-gradient-to-br from-[#3D2B1F] to-[#1A110A] border-[#8E6E00]/40 hover:border-[#8E6E00]',
  'bg-gradient-to-br from-[#2D3436] to-[#000000] border-white/20 hover:border-white/50',
  'bg-gradient-to-br from-[#3D1E1E] to-[#1E0F0F] border-red-500/20 hover:border-red-500/50',
];

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    description: '',
    slug: '',
    visualIdentity: PRESET_VISUALS[0],
    order: 0
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetched: Category[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(fetched);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await firestoreAddDoc(collection(db, 'categories'), formData);
      setIsAdding(false);
      setFormData({
        name: '',
        description: '',
        slug: '',
        visualIdentity: PRESET_VISUALS[0],
        order: categories.length
      });
      fetchCategories();
    } catch (error) {
      alert('Failed to initialize category. Check console for details.');
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, formData);
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      alert('Failed to update category.');
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This might orphan albums!')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  const startEdit = (cat: Category) => {
    setFormData({
      name: cat.name,
      description: cat.description,
      slug: cat.slug,
      visualIdentity: cat.visualIdentity,
      order: cat.order
    });
    setEditingId(cat.id);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold italic">Category Matrix</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Structure the cosmic frequencies</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleCreate} className="p-6 rounded-3xl bg-white/[0.03] border border-primary/30 space-y-4 mb-6 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                        <Tag className="w-3 h-3" /> Name
                      </label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                        placeholder="e.g. Kinetic Fire"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                        <Hash className="w-3 h-3" /> Slug
                      </label>
                      <input 
                        required
                        value={formData.slug}
                        onChange={e => setFormData({...formData, slug: e.target.value})}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                        placeholder="e.g. fusion-fast"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                      <AlignLeft className="w-3 h-3" /> Description
                    </label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors min-h-[80px] text-white"
                      placeholder="Universe essence..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Visual Identity
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {PRESET_VISUALS.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormData({...formData, visualIdentity: v})}
                          className={`w-10 h-10 rounded-lg border-2 transition-all shadow-lg ${v} ${formData.visualIdentity === v ? 'border-primary scale-110 shadow-primary/20' : 'border-transparent hover:scale-105'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-6 py-2 rounded-full bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 rounded-full bg-primary text-black text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      Initialize
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {categories.map((cat) => (
            <div 
              key={cat.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${cat.id === editingId ? 'bg-white/10 border-primary' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl shrink-0 border border-white/10 shadow-lg ${cat.visualIdentity}`} />
                <div className="flex-1">
                  {editingId === cat.id ? (
                    <input 
                      autoFocus
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="bg-transparent border-b border-primary text-sm font-bold italic focus:outline-none w-full text-white"
                    />
                  ) : (
                    <>
                      <h4 className="text-sm font-bold italic text-white flex items-center gap-2">
                        {cat.name}
                        <span className="text-[9px] font-normal uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">/{cat.slug}</span>
                      </h4>
                      <p className="text-[10px] text-white/40 line-clamp-1">{cat.description}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {editingId === cat.id ? (
                  <>
                    <button 
                      onClick={() => handleUpdate(cat.id)}
                      className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors"
                      title="Save Changes"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-full bg-white/10 text-white/40 hover:text-white transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => startEdit(cat)}
                      className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 rounded-full bg-red-400/10 text-red-400/40 hover:text-red-400 hover:bg-red-400/20 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {categories.length === 0 && !isAdding && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                <Layers className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">The void awaits structure</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
