import { useEffect, useRef, useCallback } from 'react';

interface GridPattern {
  scale: number;
  lineWidth: number;
  lineOpacity: number;
  mouseInfluenceRadius: number;
  mouseInfluenceStrength: number;
  color: string;
}

const DEFAULT_PATTERN: GridPattern = {
  scale: 100,
  lineWidth: 1.2,
  lineOpacity: 0.25,
  mouseInfluenceRadius: 400,
  mouseInfluenceStrength: 0.4,
  color: '#D4AF37',
};

export default function AnimatedGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { scale, lineWidth, lineOpacity, mouseInfluenceRadius, mouseInfluenceStrength, color } = DEFAULT_PATTERN;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = lineOpacity;

    const time = timeRef.current;
    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;

    // Draw diagonal grid lines with mouse influence
    const rows = Math.ceil(h / scale) + 2;
    const cols = Math.ceil(w / scale) + 2;

    for (let i = -2; i < cols; i++) {
      ctx.beginPath();
      for (let j = -2; j < rows; j++) {
        const baseX = i * scale;
        const baseY = j * scale;

        // Animated wave offset
        const waveX = Math.sin(time + i * 0.3 + j * 0.2) * 8;
        const waveY = Math.cos(time + j * 0.3 + i * 0.2) * 8;

        // Mouse influence
        const dx = baseX - mouseX;
        const dy = baseY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let mouseOffsetX = 0;
        let mouseOffsetY = 0;

        if (dist < mouseInfluenceRadius) {
          const influence = (1 - dist / mouseInfluenceRadius) * mouseInfluenceStrength * scale;
          mouseOffsetX = (dx / dist) * influence;
          mouseOffsetY = (dy / dist) * influence;
        }

        const x = baseX + waveX - mouseOffsetX;
        const y = baseY + waveY - mouseOffsetY;

        if (j === -2) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw cross lines
    for (let j = -2; j < rows; j++) {
      ctx.beginPath();
      for (let i = -2; i < cols; i++) {
        const baseX = i * scale;
        const baseY = j * scale;

        const waveX = Math.sin(time + i * 0.3 + j * 0.2) * 8;
        const waveY = Math.cos(time + j * 0.3 + i * 0.2) * 8;

        const dx = baseX - mouseX;
        const dy = baseY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let mouseOffsetX = 0;
        let mouseOffsetY = 0;

        if (dist < mouseInfluenceRadius) {
          const influence = (1 - dist / mouseInfluenceRadius) * mouseInfluenceStrength * scale;
          mouseOffsetX = (dx / dist) * influence;
          mouseOffsetY = (dy / dist) * influence;
        }

        const x = baseX + waveX - mouseOffsetX;
        const y = baseY + waveY - mouseOffsetY;

        if (i === -2) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    timeRef.current += 0.003;
    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #0A1628 70%, #0A1628 100%)',
        }}
      />
    </div>
  );
}
