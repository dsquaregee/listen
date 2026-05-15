import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Twitter, Facebook, Link as LinkIcon, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export default function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const shareOptions = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2]',
      href: `https://twitter.com/intent/tweet?text=Checking out ${title} on Sonic Archive&url=${encodeURIComponent(url)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 z-[101] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-bold">Share Journey</h3>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <p className="text-zinc-500 text-sm mb-6 font-medium">Transmit the frequency of "{title}" to others.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${option.color} flex flex-col items-center justify-center gap-2 p-4 rounded-2xl hover:opacity-90 transition-opacity`}
                >
                  <option.icon size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">{option.name}</span>
                </a>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block pl-2">Direct Link</label>
              <div className="flex bg-black/40 border border-white/5 rounded-2xl p-2 items-center gap-2">
                <div className="flex-1 px-3 py-1 overflow-hidden">
                  <p className="text-xs text-zinc-400 truncate">{url}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-xl text-gold transition-colors"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
