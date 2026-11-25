'use client';

import { useMemo } from 'react';
import { getFallingSet, SHAPE_MOTION } from '@/lib/falling';
import { useShop } from '../ShopProvider';
import FallingShape from './FallingShape';

const DESKTOP_COUNT = 18;
const MOBILE_COUNT = 10;

/** Bộ sinh số giả ngẫu nhiên cố định theo seed → máy chủ và trình duyệt render giống hệt nhau. */
function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const between = (rand: () => number, min: number, max: number) => min + rand() * (max - min);

/**
 * 3 lớp chiều sâu: xa (nhỏ, mờ, chậm) → gần (to, rõ, nhanh hơn) tạo cảm giác không gian.
 * Mỗi hình có 3 chuyển động lồng nhau: rơi thẳng + đung đưa trái/phải + lật/xoay/lấp lánh.
 */
const DEPTHS = [
  { chance: 0.35, size: [9, 13], alpha: 0.45, fall: [18, 24], blur: 0.6 },
  { chance: 0.8, size: [13, 19], alpha: 0.72, fall: [12, 16], blur: 0 },
  { chance: 1, size: [19, 26], alpha: 0.9, fall: [9, 12], blur: 0 },
] as const;

const MOTION_DURATION = {
  flutter: [3.2, 6],
  spin: [8, 14],
  twinkle: [1.8, 3.2],
  tilt: [2.6, 4.2],
} as const;

export default function FallingIcons() {
  const { shop } = useShop();
  const { fallingEnabled, fallingStyle, themePreset } = shop.settings;
  const enabled = fallingEnabled !== false;

  const items = useMemo(() => {
    const set = getFallingSet({ fallingStyle, themePreset });
    const pool = set.flatMap((def) => Array.from({ length: def.weight ?? 1 }, () => def));
    const rand = seededRandom(hashString(`${themePreset}|${fallingStyle}`));

    return Array.from({ length: DESKTOP_COUNT }, (_, i) => {
      const def = pool[Math.floor(rand() * pool.length)];
      const roll = rand();
      const depth = DEPTHS.find((d) => roll < d.chance) ?? DEPTHS[1];
      const motion = SHAPE_MOTION[def.shape];
      const fall = between(rand, depth.fall[0], depth.fall[1]) * (def.rise ? 1.35 : 1);
      const [mMin, mMax] = MOTION_DURATION[motion];
      return {
        key: i,
        shape: def.shape,
        color: def.colors[Math.floor(rand() * def.colors.length)],
        rise: Boolean(def.rise),
        motion,
        mobileHidden: i >= MOBILE_COUNT,
        style: {
          '--x-lg': `${((i * 100) / DESKTOP_COUNT + rand() * (100 / DESKTOP_COUNT)).toFixed(2)}%`,
          '--x-sm': `${(((i % MOBILE_COUNT) * 100) / MOBILE_COUNT + rand() * (100 / MOBILE_COUNT)).toFixed(2)}%`,
          '--size': `${Math.round(between(rand, depth.size[0], depth.size[1]))}px`,
          '--fall-dur': `${fall.toFixed(2)}s`,
          '--fall-delay': `${(-rand() * fall).toFixed(2)}s`,
          '--sway': `${Math.round(between(rand, 14, 42))}px`,
          '--sway-dur': `${between(rand, 2.8, 4.6).toFixed(2)}s`,
          '--sway-delay': `${(-rand() * 4).toFixed(2)}s`,
          '--motion-dur': `${between(rand, mMin, mMax).toFixed(2)}s`,
          '--rot': `${Math.round((rand() > 0.5 ? 1 : -1) * between(rand, 200, 360))}deg`,
          '--alpha': depth.alpha,
          '--blur': depth.blur ? `blur(${depth.blur}px)` : 'none',
        } as React.CSSProperties,
      };
    });
  }, [fallingStyle, themePreset]);

  if (!enabled) return null;

  return (
    <div className="falling-layer" aria-hidden="true">
      {items.map((it) => (
        <span key={it.key} className={`falling-item ${it.rise ? 'is-rising' : ''} ${it.mobileHidden ? 'max-sm:hidden' : ''}`} style={it.style}>
          <span className="falling-sway">
            <span className={`falling-motion motion-${it.motion}`}>
              <FallingShape shape={it.shape} color={it.color} />
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
