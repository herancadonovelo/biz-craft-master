import { useEffect, useRef } from "react";

export function AudioVisualizer({ analyser, active, className }: { analyser: AnalyserNode | null; active: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const bars = 28;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const draw = () => {
      const w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);
      const color = getComputedStyle(c).color || "#999";
      ctx.fillStyle = color;
      for (let i = 0; i < bars; i++) {
        let v: number;
        if (active && analyser && data) {
          analyser.getByteFrequencyData(data);
          v = data[Math.floor((i / bars) * data.length)] / 255;
        } else {
          v = active ? 0.3 + 0.3 * Math.sin(Date.now() / 300 + i) : 0.08;
        }
        const bw = w / bars * 0.6;
        const gap = w / bars * 0.4;
        const bh = Math.max(2 * dpr, v * h);
        ctx.fillRect(i * (bw + gap), (h - bh) / 2, bw, bh);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [analyser, active]);

  return <canvas ref={canvasRef} className={className} />;
}