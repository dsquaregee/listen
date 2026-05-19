import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, orderBy } from 'firebase/firestore';

export default function Zones() {
  const [zones, setZones] = useState<any[]>([]);
  const [newZone, setNewZone] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'zones'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setZones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZone.trim()) return;
    await addDoc(collection(db, 'zones'), { name: newZone });
    setNewZone('');
  };

  const handleDeleteZone = async (id: string) => {
    await deleteDoc(doc(db, 'zones', id));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold">Manage Zones</h2>
      <form onSubmit={handleAddZone} className="flex gap-4">
        <input 
          value={newZone} 
          onChange={(e) => setNewZone(e.target.value)}
          placeholder="New Zone Name"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
        />
        <button className="bg-indigo-500 px-6 py-3 rounded-xl font-bold">Add</button>
      </form>
      <div className="space-y-4">
        {zones.map(zone => (
          <div key={zone.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <span>{zone.name}</span>
            <button onClick={() => handleDeleteZone(zone.id)} className="text-rose-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
