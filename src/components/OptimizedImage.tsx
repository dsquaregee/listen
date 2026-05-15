import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getAssetUrl } from '../lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackUrl?: string;
  withWatermark?: boolean;
}

export function OptimizedImage({ className, src, alt, withWatermark = true, ...props }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-white/5 group/img", className)}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/5 animate-pulse"
          />
        )}
      </AnimatePresence>
      
      <img
        src={error ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400' : getAssetUrl(src)}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-700 pointer-events-none select-none",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
        {...props}
      />

      {/* Watermark Overlay */}
      {withWatermark && isLoaded && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] flex items-center justify-center overflow-hidden rotate-[-25deg] select-none">
          <div className="flex flex-col gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-12 whitespace-nowrap">
                {Array.from({ length: 6 }).map((_, j) => (
                  <span key={j} className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">
                    © DsquareGee • Digital Resonance
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Subtle bottom copyright */}
      {withWatermark && isLoaded && (
        <div className="absolute bottom-1 right-1 opacity-20 pointer-events-none scale-50 origin-bottom-right">
           <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">Protected Media</span>
        </div>
      )}
    </div>
  );
}
