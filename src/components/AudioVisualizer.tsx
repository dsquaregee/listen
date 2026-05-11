import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyzer: AnalyserNode | null;
  isPlaying: boolean;
}

export default function AudioVisualizer({ analyzer, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const dataArray = new Uint8Array(analyzer?.frequencyBinCount || 0);

    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number; color: string }[] = [];
    const particleColors = ['#D4AF37', '#F4C430', '#ffffff'];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3 + 0.05,
        color: particleColors[Math.floor(Math.random() * particleColors.length)]
      });
    }

    let hue = 46; // Start with Gold hue

    const draw = () => {
      if (!analyzer || !isPlaying) {
        // Stop the animation loop immediately when paused or analyzer is missing.
        // We don't call requestAnimationFrame(draw) here, effectively "freezing" the last frame.
        return;
      }

      analyzer.getByteFrequencyData(dataArray);
      
      // Fine-tuned mapping for 256 fftSize (128 bins)
      // Bass: 0-4 bins (~0-860Hz)
      const lowEnergy = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      // Mids: 5-30 bins (~860Hz-5kHz)
      const midEnergy = dataArray.slice(5, 31).reduce((a, b) => a + b, 0) / 26;
      // Highs: 31-127 bins (~5kHz-22kHz)
      const highEnergy = dataArray.slice(31, 128).reduce((a, b) => a + b, 0) / 97;
      
      const normalizedLow = lowEnergy / 255;
      const normalizedMid = midEnergy / 255;
      const normalizedHigh = highEnergy / 255;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Low Frequencies -> Dynamic movement & background pulsing
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Mid Frequencies -> Glow Intensity
      const gradientOpacity = 0.05 + normalizedMid * 0.15;
      const gradRadius = canvas.width * (0.8 + normalizedLow * 0.4);
      
      const gradient1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gradRadius);
      gradient1.addColorStop(0, `hsla(${hue}, 80%, 60%, ${gradientOpacity})`);
      gradient1.addColorStop(0.5, `hsla(${hue}, 40%, 30%, ${gradientOpacity * 0.4})`);
      gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // High Frequencies -> Subtle Color Shifts
      const hueShift = normalizedHigh * 2;
      hue = (hue + 0.05 + hueShift) % 360;

      // Reacting particles with flow
      particles.forEach((p, i) => {
        // Individual particle bounce/reactivity based on local dataArray segment
        const segmentData = dataArray[i % dataArray.length] / 255;
        
        // Low energy influences global chaos and particle speed
        const speedMultiplier = 1 + normalizedLow * 8;
        const flowX = Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.2;
        
        p.x += (p.speedX + flowX) * speedMultiplier;
        p.y += p.speedY * speedMultiplier;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        const sizeMultipier = 1 + segmentData * 2 + normalizedLow * 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * sizeMultipier, 0, Math.PI * 2);
        
        // Mid energy influences per-particle halo/glow
        if (normalizedMid > 0.4 || segmentData > 0.7) {
          ctx.shadowBlur = 15 * normalizedMid * (segmentData + 0.5);
          ctx.shadowColor = `hsla(${hue + 40}, 100%, 70%, 1)`;
        } else {
          ctx.shadowBlur = 0;
        }

        // Color shifts influenced by high frequencies
        const pColorHue = (hue + (i * 2) + (normalizedHigh * 60)) % 360;
        ctx.fillStyle = `hsla(${pColorHue}, 70%, 70%, ${p.opacity * (0.4 + segmentData * 0.6)})`;
        ctx.fill();

        // Subtle connection lines (reactive to mids/highs)
        if (i % 4 === 0 && normalizedMid > 0.2) {
           particles.slice(i + 1, i + 3).forEach(p2 => {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `hsla(${pColorHue}, 50%, 50%, ${0.08 * (1 - distance / 150) * (normalizedMid + 0.2)})`;
              ctx.lineWidth = 0.4 * (normalizedHigh + 0.5);
              ctx.stroke();
            }
          });
        }
      });

      // Ambient light streaks
      ctx.shadowBlur = 0;
      for (let i = 0; i < 3; i++) {
        const y = (Date.now() * 0.05 + i * canvas.height / 3) % canvas.height;
        const streakAlpha = 0.02 * (1 + normalizedLow);
        const streakGradient = ctx.createLinearGradient(0, y, canvas.width, y);
        streakGradient.addColorStop(0, 'rgba(212, 175, 55, 0)');
        streakGradient.addColorStop(0.5, `rgba(212, 175, 55, ${streakAlpha})`);
        streakGradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = streakGradient;
        ctx.fillRect(0, y - 50, canvas.width, 100);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyzer, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
