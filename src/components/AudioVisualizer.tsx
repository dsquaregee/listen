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
    const particleColors = ['#9966CC', '#D4BBFF', '#2D1B4D', '#ffffff'];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.4,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.4 + 0.05,
        color: particleColors[Math.floor(Math.random() * particleColors.length)]
      });
    }

    let hue = 270; // Start with Amethyst hue
    let targetHue = 270;

    const draw = () => {
      if (!analyzer || !isPlaying) {
        return;
      }

      analyzer.getByteFrequencyData(dataArray);
      
      const lowEnergy = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const midEnergy = dataArray.slice(5, 31).reduce((a, b) => a + b, 0) / 26;
      const highEnergy = dataArray.slice(31, 128).reduce((a, b) => a + b, 0) / 97;
      
      const normalizedLow = lowEnergy / 255;
      const normalizedMid = midEnergy / 255;
      const normalizedHigh = highEnergy / 255;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Gradually shift between Amethyst (270) and Deep Amethyst (310) based on energy
      targetHue = normalizedHigh > 0.4 ? 310 : 270;
      hue = hue + (targetHue - hue) * 0.02;

      const gradientOpacity = 0.03 + normalizedMid * 0.12;
      const gradRadius = canvas.width * (0.7 + normalizedLow * 0.5);
      
      const gradient1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gradRadius);
      gradient1.addColorStop(0, `hsla(${hue}, 70%, 50%, ${gradientOpacity})`);
      gradient1.addColorStop(0.6, `hsla(${hue + 20}, 40%, 20%, ${gradientOpacity * 0.3})`);
      gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Reacting particles
      particles.forEach((p, i) => {
        const segmentData = dataArray[i % dataArray.length] / 255;
        const speedMultiplier = 0.8 + normalizedLow * 6;
        const flowX = Math.sin(Date.now() * 0.0008 + p.y * 0.012) * 0.15;
        
        p.x += (p.speedX + flowX) * speedMultiplier;
        p.y += p.speedY * speedMultiplier;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const sizeMultipier = 1 + segmentData * 1.5 + normalizedLow * 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * sizeMultipier, 0, Math.PI * 2);
        
        if (normalizedMid > 0.45 || segmentData > 0.75) {
          ctx.shadowBlur = 12 * normalizedMid * (segmentData + 0.4);
          ctx.shadowColor = i % 2 === 0 ? `hsla(300, 100%, 70%, 0.8)` : `hsla(270, 100%, 70%, 0.8)`;
        } else {
          ctx.shadowBlur = 0;
        }

        const pColorHue = i % 2 === 0 ? 300 : (hue + (i * 1.5)) % 360;
        ctx.fillStyle = `hsla(${pColorHue}, 60%, 75%, ${p.opacity * (0.3 + segmentData * 0.7)})`;
        ctx.fill();

        if (i % 5 === 0 && normalizedMid > 0.25) {
           particles.slice(i + 1, i + 3).forEach(p2 => {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `hsla(${pColorHue}, 40%, 60%, ${0.06 * (1 - distance / 120) * (normalizedMid + 0.1)})`;
              ctx.lineWidth = 0.3 * (normalizedHigh + 0.4);
              ctx.stroke();
            }
          });
        }
      });

      // Ambient cinematic light streaks using accent color
      ctx.shadowBlur = 0;
      for (let i = 0; i < 2; i++) {
        const y = (Date.now() * 0.03 + i * canvas.height / 2) % canvas.height;
        const streakAlpha = 0.015 * (1 + normalizedLow);
        const streakColor = i === 0 ? '212, 187, 255' : '153, 102, 204'; // Light Amethyst vs Amethyst
        const streakGradient = ctx.createLinearGradient(0, y, canvas.width, y);
        streakGradient.addColorStop(0, `rgba(${streakColor}, 0)`);
        streakGradient.addColorStop(0.5, `rgba(${streakColor}, ${streakAlpha})`);
        streakGradient.addColorStop(1, `rgba(${streakColor}, 0)`);
        ctx.fillStyle = streakGradient;
        ctx.fillRect(0, y - 40, canvas.width, 80);
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
