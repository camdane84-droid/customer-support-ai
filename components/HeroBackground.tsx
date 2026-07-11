'use client';

import { useEffect, useRef } from 'react';

const HELIX_PARTICLE_COUNT = 400;
const ORBITAL_PARTICLE_COUNT = 50;
const STRAND_A_COLOR = 'rgba(139,92,246,0.9)';
const STRAND_B_COLOR = 'rgba(196,167,255,0.9)';
const ROTATION_SPEED = 0.0005;
const HELIX_RADIUS_TOP = 280;
const HELIX_RADIUS_BOTTOM = 8;
const HELIX_VERTICAL_SPREAD = 0.75;

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    // Pre-rendered dot sprites
    const spriteSize = 20;

    function createDotSprite(color: string, radius: number): HTMLCanvasElement {
      const c = document.createElement('canvas');
      c.width = spriteSize;
      c.height = spriteSize;
      const sCtx = c.getContext('2d')!;
      const g = sCtx.createRadialGradient(
        spriteSize / 2, spriteSize / 2, 0,
        spriteSize / 2, spriteSize / 2, radius
      );
      g.addColorStop(0, color);
      g.addColorStop(0.4, color.replace(/[\d.]+\)$/, '0.5)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = g;
      sCtx.fillRect(0, 0, spriteSize, spriteSize);
      return c;
    }

    const spriteA = createDotSprite(STRAND_A_COLOR, 8);
    const spriteB = createDotSprite(STRAND_B_COLOR, 8);
    const spriteOrbital = createDotSprite(STRAND_A_COLOR, 5);

    // Particle data
    const helixAngles = new Float64Array(HELIX_PARTICLE_COUNT);
    const helixYNorm = new Float64Array(HELIX_PARTICLE_COUNT);
    const helixStrands = new Float64Array(HELIX_PARTICLE_COUNT);
    const helixSpeeds = new Float64Array(HELIX_PARTICLE_COUNT);

    for (let i = 0; i < HELIX_PARTICLE_COUNT; i++) {
      helixAngles[i] = (i / HELIX_PARTICLE_COUNT) * Math.PI * 8 + (i % 2 === 0 ? 0 : Math.PI);
      helixYNorm[i] = i / HELIX_PARTICLE_COUNT;
      helixStrands[i] = i % 2 === 0 ? 0 : 1;
      helixSpeeds[i] = 0.8 + Math.random() * 0.4;
    }

    const orbAngles = new Float64Array(ORBITAL_PARTICLE_COUNT);
    const orbRadiiMult = new Float64Array(ORBITAL_PARTICLE_COUNT);
    const orbSpeeds = new Float64Array(ORBITAL_PARTICLE_COUNT);
    const orbYNorm = new Float64Array(ORBITAL_PARTICLE_COUNT);
    const orbPhases = new Float64Array(ORBITAL_PARTICLE_COUNT);

    for (let i = 0; i < ORBITAL_PARTICLE_COUNT; i++) {
      orbAngles[i] = Math.random() * Math.PI * 2;
      orbRadiiMult[i] = 1.3 + Math.random() * 1.2;
      orbSpeeds[i] = (0.3 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1);
      orbYNorm[i] = Math.random();
      orbPhases[i] = Math.random() * Math.PI * 2;
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function radiusAt(yNorm: number): number {
      return HELIX_RADIUS_TOP + (HELIX_RADIUS_BOTTOM - HELIX_RADIUS_TOP) * yNorm;
    }

    let time = 0;

    function draw() {
      if (!ctx) return;
      time += 1;

      const cx = width / 2;
      const topY = height * 0.08;
      const verticalRange = height * HELIX_VERTICAL_SPREAD;
      const rotation = time * ROTATION_SPEED;

      ctx.clearRect(0, 0, width, height);

      // Helix particles - funnel shaped
      for (let i = 0; i < HELIX_PARTICLE_COUNT; i++) {
        const yN = helixYNorm[i];
        const r = radiusAt(yN);
        const angle = helixAngles[i] + rotation * helixSpeeds[i];
        const x = cx + Math.cos(angle) * r;
        const z = Math.sin(angle);
        const y = topY + yN * verticalRange;

        const alpha = 0.35 + (z + 1) * 0.325;
        const scale = 0.5 + (z + 1) * 0.3;

        ctx.globalAlpha = alpha;
        const sprite = helixStrands[i] === 0 ? spriteA : spriteB;
        const drawSize = spriteSize * scale;
        ctx.drawImage(sprite, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
      }

      // Orbital particles
      const halfSprite = spriteSize / 2;
      for (let i = 0; i < ORBITAL_PARTICLE_COUNT; i++) {
        const yN = orbYNorm[i];
        const localR = radiusAt(yN);
        const angle = orbAngles[i] + rotation * orbSpeeds[i];

        const shrink = 0.998 + 0.002 * Math.sin(time * 0.002 + orbPhases[i]);
        orbRadiiMult[i] *= shrink;
        if (orbRadiiMult[i] < 0.3) {
          orbRadiiMult[i] = 1.3 + Math.random() * 1.2;
        }

        const r = localR * orbRadiiMult[i];
        const x = cx + Math.cos(angle) * r;
        const y = topY + yN * verticalRange + Math.sin(angle + orbPhases[i]) * 15;
        const alpha = Math.max(0.15, 1 - orbRadiiMult[i] / 2.5);

        ctx.globalAlpha = alpha * 0.7;
        ctx.drawImage(spriteOrbital, x - halfSprite, y - halfSprite, spriteSize, spriteSize);
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    }

    resize();
    animationId = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
