import { useEffect, useRef } from 'react';
import { sanitizeColor, clampNumber } from './types';
import { useAnimationLoop, getMobileDpr } from '@/hooks/useAnimationLoop';

/**
 * Bulka brand background — floating cookies with boids physics that scatter from
 * the cursor. Ported from the marketing site (bulkavpn.net, index.html) to the
 * cabinet's canvas-background contract: driven by `settings`, rendered via the
 * shared useAnimationLoop (FPS throttle + visibility/Telegram pause), sized to
 * the parent, retina-aware via getMobileDpr.
 */
interface Props {
  settings: Record<string, unknown>;
}

interface Cookie {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface CookiesState {
  ctx: CanvasRenderingContext2D;
  cookies: Cookie[];
  w: number;
  h: number;
  dpr: number;
  sprite: HTMLCanvasElement;
}

const CELL = 80; // spatial-grid cell for neighbour separation
const SPRITE = 32; // sprite bitmap size (device-independent px)

/** Build the 32×32 cookie sprite: amber disc + 3 chocolate chips. */
function makeSprite(cookieColor: string, chipColor: string): HTMLCanvasElement {
  const s = document.createElement('canvas');
  s.width = SPRITE;
  s.height = SPRITE;
  const sc = s.getContext('2d');
  if (sc) {
    sc.lineJoin = 'round';
    sc.lineCap = 'round';
    sc.beginPath();
    sc.arc(16, 16, 12.5, 0, Math.PI * 2);
    sc.fillStyle = cookieColor;
    sc.fill();
    sc.fillStyle = chipColor;
    for (const [x, y] of [
      [12.25, 12.25],
      [21, 14.75],
      [13.5, 21],
    ]) {
      sc.beginPath();
      sc.arc(x, y, 2.5, 0, Math.PI * 2);
      sc.fill();
    }
  }
  return s;
}

export default function BulkaCookiesBackground({ settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CookiesState | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, down: false });

  const cookieColor = sanitizeColor(settings.cookieColor, '#E8A33D');
  const chipColor = sanitizeColor(settings.chipColor, '#7A3F12');
  const count = clampNumber(settings.count, 20, 200, 90);
  const speed = clampNumber(settings.speed, 0.3, 3, 1);
  const size = clampNumber(settings.size, 0.5, 2.5, 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = getMobileDpr();
    const parent = canvas.parentElement;
    const measure = () => ({
      w: parent?.offsetWidth ?? window.innerWidth,
      h: parent?.offsetHeight ?? window.innerHeight,
    });

    const setup = () => {
      const { w, h } = measure();
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w, h };
    };

    const base = setup();
    if (!base) return;

    const spawn = (w: number, h: number): Cookie[] =>
      Array.from({ length: Math.floor(count) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
      }));

    stateRef.current = {
      ctx: base.ctx,
      cookies: spawn(base.w, base.h),
      w: base.w,
      h: base.h,
      dpr,
      sprite: makeSprite(cookieColor, chipColor),
    };

    const onResize = () => {
      const next = setup();
      if (!next || !stateRef.current) return;
      stateRef.current.ctx = next.ctx;
      stateRef.current.w = next.w;
      stateRef.current.h = next.h;
      stateRef.current.cookies = spawn(next.w, next.h);
    };

    // Pointer interaction — coordinates are relative to the canvas box.
    const rect = () => canvas.getBoundingClientRect();
    const onMove = (e: MouseEvent) => {
      const r = rect();
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;
    };
    const onDown = () => {
      mouseRef.current.down = true;
    };
    const onUp = () => {
      mouseRef.current.down = false;
    };
    const onLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    window.addEventListener('mouseout', onLeave, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseout', onLeave);
    };
    // Re-init when the visual params that seed sprites/cookies change.
  }, [count, cookieColor, chipColor]);

  useAnimationLoop(() => {
    const state = stateRef.current;
    if (!state) return;
    const { ctx, cookies, w, h, sprite } = state;
    const mouse = mouseRef.current;

    // Neighbour grid (rebuilt each frame — cheap for ≤200 items).
    const grid = new Map<string, Cookie[]>();
    for (const c of cookies) {
      const k = `${Math.floor(c.x / CELL)},${Math.floor(c.y / CELL)}`;
      const arr = grid.get(k);
      if (arr) arr.push(c);
      else grid.set(k, [c]);
    }

    const SEP = 40;
    const SEP_SQ = SEP * SEP;

    for (const R of cookies) {
      // Cursor: repel on hover, stronger pull on press.
      const ax = R.x - mouse.x;
      const ay = R.y - mouse.y;
      const d2 = ax * ax + ay * ay;
      if (mouse.down) {
        if (d2 > 25 && d2 < 1e6) {
          const dist = Math.sqrt(d2);
          const tt = 1 - dist * 0.001;
          const force = tt * tt * 8 * speed;
          const inv = 1 / dist;
          R.vx -= ax * (force * inv) + -ay * (force * 0.6 * inv);
          R.vy -= ay * (force * inv) + ax * (force * 0.6 * inv);
        }
      } else if (d2 < 90000 && d2 > 0) {
        const dist = Math.sqrt(d2);
        const tt = 1 - dist / 300;
        const force = tt * tt * 5 * speed;
        const inv = 1 / dist;
        R.vx += ax * (force * inv) + -ay * (force * 0.5 * inv);
        R.vy += ay * (force * inv) + ax * (force * 0.5 * inv);
      }

      // Separation from nearby cookies.
      const cx = Math.floor(R.x / CELL);
      const cy = Math.floor(R.y / CELL);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const arr = grid.get(`${cx + dx},${cy + dy}`);
          if (!arr) continue;
          for (const N of arr) {
            if (N === R) continue;
            const dxn = R.x - N.x;
            const dyn = R.y - N.y;
            const d2n = dxn * dxn + dyn * dyn;
            if (d2n < SEP_SQ && d2n > 1) {
              const dist = Math.sqrt(d2n);
              const tt = ((SEP - dist) / SEP) * 0.3 * speed;
              const inv = 1 / dist;
              R.vx += dxn * inv * tt;
              R.vy += dyn * inv * tt;
            }
          }
        }
      }

      // Wander.
      R.vx += (Math.random() - 0.5) * 0.01 * speed;
      R.vy += (Math.random() - 0.5) * 0.01 * speed;

      // Speed limit.
      const v2 = R.vx * R.vx + R.vy * R.vy;
      const MAX_SQ = 76;
      if (v2 > MAX_SQ) {
        const k = 8.7 / Math.sqrt(v2);
        R.vx *= k;
        R.vy *= k;
      }

      // Bounce off edges.
      const M = 10;
      const RX = w - M;
      const RY = h - M;
      if (R.x < M) {
        R.x = M;
        R.vx *= -1.5;
      } else if (R.x > RX) {
        R.x = RX;
        R.vx *= -1.5;
      }
      if (R.y < M) {
        R.y = M;
        R.vy *= -1.5;
      } else if (R.y > RY) {
        R.y = RY;
        R.vy *= -1.5;
      }

      // Friction + move.
      R.vx *= 0.982;
      R.vy *= 0.982;
      R.x += R.vx;
      R.y += R.vy;
    }

    // Draw — muted like the marketing site (there: canvas opacity 0.35 × sprite
    // alpha 0.7 ≈ 0.25). The cabinet's cards are translucent, so opaque bright
    // sprites would bleed through and distract; keep the cookies as a faint
    // backdrop. Admins can still tune further via the background opacity slider.
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.22;
    const drawSize = SPRITE * size;
    const half = drawSize / 2;
    for (const R of cookies) {
      ctx.drawImage(sprite, R.x - half, R.y - half, drawSize, drawSize);
    }
    ctx.globalAlpha = 1;
  }, [count, speed, size, cookieColor, chipColor]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
