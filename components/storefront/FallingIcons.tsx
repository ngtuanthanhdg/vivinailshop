'use client';

import { useMemo } from 'react';
import { getFallingIcons } from '@/lib/shop';
import { useShop } from '../ShopProvider';

const DESKTOP_COUNT = 20;
const MOBILE_COUNT = 12;

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

export default function FallingIcons() {
  const { shop } = useShop();
  const { fallingEnabled, fallingStyle, themePreset } = shop.settings;
  const enabled = fallingEnabled !== false;

  const items = useMemo(() => {
    const icons = getFallingIcons({ fallingStyle, themePreset });
    const rand = seededRandom(hashString(`${themePreset}|${fallingStyle}`));
    return Array.from({ length: DESKTOP_COUNT }, (_, i) => {
      const leftLg = (i * 100) / DESKTOP_COUNT + rand() * (100 / DESKTOP_COUNT);
      const leftSm = i < MOBILE_COUNT ? (i * 100) / MOBILE_COUNT + rand() * (100 / MOBILE_COUNT) : 0;
      return {
        icon: icons[i % icons.length],
        leftLg: leftLg.toFixed(2),
        leftSm: leftSm.toFixed(2),
        mobileHidden: i >= MOBILE_COUNT,
        duration: (7 + rand() * 7).toFixed(2),
        delay: (-rand() * 12).toFixed(2),
        size: Math.round(14 + rand() * 10),
        drift: Math.round((rand() - 0.5) * 110),
        spin: Math.round((rand() > 0.5 ? 1 : -1) * (180 + rand() * 240)),
      };
    });
  }, [fallingStyle, themePreset]);

  if (!enabled) return null;

  return (
    <div className="falling-icons-layer" aria-hidden="true">
      {items.map((it, i) => (
        <span
          key={i}
          className={`falling-icon-item ${it.mobileHidden ? 'max-sm:hidden' : ''}`}
          style={
            {
              '--left-sm': `${it.leftSm}%`,
              '--left-lg': `${it.leftLg}%`,
              '--drift-x': `${it.drift}px`,
              '--spin-deg': `${it.spin}deg`,
              fontSize: `${it.size}px`,
              animationDuration: `${it.duration}s`,
              animationDelay: `${it.delay}s`,
            } as React.CSSProperties
          }
        >
          {it.icon}
        </span>
      ))}
    </div>
  );
}
