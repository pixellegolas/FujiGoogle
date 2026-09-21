// Interactive camera simulation for development and desktop preview

export function createSimulatedCameraCanvas(width = 1280, height = 720): {
  canvas: HTMLCanvasElement;
  start: () => void;
  stop: () => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  let animId: number;
  let t = 0;

  // Render a stylish Nordic / Tokyo street scene with lighting suitable for testing recipes
  const renderFrame = () => {
    t += 0.015;
    const w = canvas.width;
    const h = canvas.height;

    // Sky with gentle gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    skyGrad.addColorStop(0, '#1c2630');
    skyGrad.addColorStop(0.4, '#394d61');
    skyGrad.addColorStop(1, '#a3978a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Warm evening sun / specular source (great for halation & bloom test!)
    const sunX = w * 0.72 + Math.sin(t * 0.3) * 15;
    const sunY = h * 0.28 + Math.cos(t * 0.3) * 8;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 180);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.15, 'rgba(255, 240, 210, 0.95)');
    sunGrad.addColorStop(0.4, 'rgba(255, 170, 90, 0.6)');
    sunGrad.addColorStop(1, 'rgba(255, 120, 40, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
    ctx.fill();

    // Distant city skyline / silhouettes
    ctx.fillStyle = '#1e2429';
    for (let i = 0; i < 18; i++) {
      const bw = w * 0.07;
      const bx = i * bw * 0.85;
      const bh = h * (0.18 + Math.sin(i * 1.7) * 0.08);
      ctx.fillRect(bx, h * 0.52 - bh, bw, bh + h * 0.5);
    }

    // Midground buildings with glowing neon signs (Tokyo / Stockholm vibes)
    ctx.fillStyle = '#111417';
    ctx.fillRect(w * 0.05, h * 0.38, w * 0.35, h * 0.62);
    ctx.fillRect(w * 0.55, h * 0.34, w * 0.42, h * 0.66);

    // Neon signs / Specular lights (to test halation!)
    ctx.fillStyle = '#ff2a2a';
    ctx.shadowColor = '#ff2a2a';
    ctx.shadowBlur = 15;
    ctx.fillRect(w * 0.12, h * 0.45, 16, 45);
    ctx.fillStyle = '#ffd24a';
    ctx.shadowColor = '#ffd24a';
    ctx.fillRect(w * 0.62, h * 0.42, 22, 14);
    ctx.shadowBlur = 0;

    // Street ground with asphalt reflection
    const groundGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
    groundGrad.addColorStop(0, '#1c1c1f');
    groundGrad.addColorStop(0.3, '#2a2826');
    groundGrad.addColorStop(1, '#0e0e10');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.55, w, h * 0.45);

    // Street light with intense specular point
    const lampX = w * 0.38;
    const lampY = h * 0.35;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lampX, h * 0.85);
    ctx.lineTo(lampX, lampY);
    ctx.stroke();

    // High-contrast lamp glow (Halation test)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lampX, lampY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Moving pedestrian silhouette
    const pedX = (w * 0.45 + Math.sin(t) * w * 0.25);
    const pedY = h * 0.72;
    ctx.fillStyle = '#08080a';
    // Head
    ctx.beginPath();
    ctx.arc(pedX, pedY - 45, 10, 0, Math.PI * 2);
    ctx.fill();
    // Coat
    ctx.beginPath();
    ctx.moveTo(pedX - 14, pedY + 25);
    ctx.lineTo(pedX + 14, pedY + 25);
    ctx.lineTo(pedX + 10, pedY - 35);
    ctx.lineTo(pedX - 10, pedY - 35);
    ctx.closePath();
    ctx.fill();

    // Street bokeh reflections
    for (let k = 0; k < 6; k++) {
      const bx = (w * 0.2 + k * 85 + Math.sin(t + k) * 10) % w;
      const by = h * 0.82 + (k % 3) * 20;
      ctx.fillStyle = k % 2 === 0 ? 'rgba(255, 180, 80, 0.45)' : 'rgba(255, 70, 50, 0.4)';
      ctx.beginPath();
      ctx.arc(bx, by, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    animId = requestAnimationFrame(renderFrame);
  };

  return {
    canvas,
    start: () => {
      cancelAnimationFrame(animId);
      renderFrame();
    },
    stop: () => {
      cancelAnimationFrame(animId);
    }
  };
}
