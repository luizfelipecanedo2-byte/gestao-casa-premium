// Utilitário de confetes leves em HTML5 Canvas nativo com zero dependências externas

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

export function triggerConfetti(options?: { count?: number; durationMs?: number }) {
  if (typeof window === 'undefined') return;

  const count = options?.count ?? 120;
  const durationMs = options?.durationMs ?? 3500;

  let canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = [
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#a855f7', // purple
    '#f59e0b', // amber
    '#ec4899', // pink
    '#f43f5e', // rose
    '#fbbf24'  // gold
  ];

  const particles: Particle[] = [];

  // Spawn particles from mid-screen / top
  for (let i = 0; i < count; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * (width * 0.6),
      y: Math.random() * (height * 0.35),
      w: Math.random() * 8 + 6,
      h: Math.random() * 6 + 4,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -6 - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      opacity: 1,
      shape: Math.random() > 0.3 ? 'rect' : 'circle'
    });
  }

  let startTime = performance.now();
  let animationFrameId: number;

  function animate(now: number) {
    if (!ctx) return;
    const elapsed = now - startTime;
    const progress = elapsed / durationMs;

    ctx.clearRect(0, 0, width, height);

    let activeParticles = 0;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rotationSpeed;

      if (progress > 0.6) {
        p.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
      }

      if (p.opacity > 0 && p.y < height + 50) {
        activeParticles++;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    if (elapsed < durationMs && activeParticles > 0) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(animate);
}
