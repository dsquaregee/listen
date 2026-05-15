import React from 'react';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`} 
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(39, 39, 42, 0) 0, rgba(39, 39, 42, 0.4) 50%, rgba(39, 39, 42, 0) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear'
      }}
    />
  );
}
