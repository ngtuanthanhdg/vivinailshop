import type { Settings } from './types';

/**
 * Hiệu ứng rơi: mỗi "bộ" gồm vài hình SVG + bảng màu + kiểu chuyển động.
 * Màu có thể dùng biến theme (var(--accent-main)…) để tự hợp với mọi theme.
 */
export type FallingShapeKind =
  | 'petal'
  | 'blossom'
  | 'sparkle'
  | 'heart'
  | 'star'
  | 'snowflake'
  | 'leaf'
  | 'bubble'
  | 'bow'
  | 'lantern'
  | 'moon'
  | 'pumpkin'
  | 'bat'
  | 'confetti'
  | 'dot';

/**
 * - flutter: lật 3D nhẹ như cánh hoa, lá
 * - spin: xoay tròn chậm
 * - twinkle: lấp lánh (phóng to/thu nhỏ)
 * - tilt: lắc lư nhẹ, giữ dáng (tim, nơ, đèn lồng…)
 */
export type FallingMotion = 'flutter' | 'spin' | 'twinkle' | 'tilt';

export interface FallingItemDef {
  shape: FallingShapeKind;
  colors: string[];
  /** Tần suất xuất hiện tương đối (mặc định 1). */
  weight?: number;
  /** Bay lên thay vì rơi xuống (bong bóng, đèn lồng). */
  rise?: boolean;
}

export const SHAPE_MOTION: Record<FallingShapeKind, FallingMotion> = {
  petal: 'flutter',
  leaf: 'flutter',
  confetti: 'flutter',
  blossom: 'spin',
  snowflake: 'spin',
  star: 'spin',
  sparkle: 'twinkle',
  dot: 'twinkle',
  heart: 'tilt',
  bow: 'tilt',
  lantern: 'tilt',
  moon: 'tilt',
  pumpkin: 'tilt',
  bat: 'tilt',
  bubble: 'tilt',
};

const ACCENT = 'var(--accent-main)';
const SOFT = 'var(--border-soft)';

export const FALLING_SETS: Record<string, FallingItemDef[]> = {
  elegant: [
    { shape: 'petal', colors: [ACCENT, SOFT, '#D9B48F'], weight: 3 },
    { shape: 'sparkle', colors: ['#E3B964', ACCENT], weight: 2 },
    { shape: 'blossom', colors: [SOFT, '#E8CDB0'] },
  ],
  sakura: [
    { shape: 'petal', colors: ['#F7A8C4', '#FBC9DA', '#F28DB2', '#FFDCE8'], weight: 4 },
    { shape: 'blossom', colors: ['#F9B4CC', '#FCCFDD'], weight: 1 },
    { shape: 'sparkle', colors: ['#F6B8CF'], weight: 1 },
  ],
  tet: [
    { shape: 'blossom', colors: ['#F5C21B', '#FFD54A'], weight: 3 },
    { shape: 'blossom', colors: ['#F48FB1', '#F9B4CC'], weight: 2 },
    { shape: 'petal', colors: ['#F7B6C8', '#FFD54A'], weight: 2 },
    { shape: 'sparkle', colors: ['#E8B931'], weight: 1 },
    { shape: 'confetti', colors: ['#D7263D', '#E8B931'], weight: 1 },
  ],
  snow: [
    { shape: 'snowflake', colors: ['#9CCFEA', '#BFE3F7', '#7FBCE0'], weight: 3 },
    { shape: 'dot', colors: ['#CFE8F7', '#B5DBF2'], weight: 3 },
    { shape: 'sparkle', colors: ['#A9D6F0'], weight: 1 },
  ],
  'mid-autumn': [
    { shape: 'lantern', colors: ['#E53935', '#F57C00'], weight: 3, rise: true },
    { shape: 'moon', colors: ['#F6C343'], weight: 1 },
    { shape: 'sparkle', colors: ['#F6C343', '#FFB74D'], weight: 2 },
  ],
  halloween: [
    { shape: 'bat', colors: ['#7E5AA6', '#5B4378'], weight: 2 },
    { shape: 'pumpkin', colors: ['#F97316', '#FB923C'], weight: 2 },
    { shape: 'star', colors: ['#FCD34D'], weight: 1 },
  ],
  'love-bow': [
    { shape: 'heart', colors: ['#F472B6', '#FB7185', '#F9A8D4'], weight: 3 },
    { shape: 'bow', colors: ['#EC4899', '#F9A8D4'], weight: 2 },
    { shape: 'sparkle', colors: ['#F9A8D4'], weight: 1 },
  ],
  'star-bubble': [
    { shape: 'bubble', colors: ['#93C5FD', '#C4B5FD', '#F9A8D4'], weight: 3, rise: true },
    { shape: 'star', colors: ['#FCD34D', '#A5B4FC', '#F9A8D4'], weight: 2 },
    { shape: 'sparkle', colors: ['#FDE68A'], weight: 1 },
  ],
  firework: [
    { shape: 'sparkle', colors: ['#FDE047', '#FACC15', '#FFF7CC'], weight: 3 },
    { shape: 'confetti', colors: ['#F472B6', '#60A5FA', '#FDE047'], weight: 3 },
    { shape: 'star', colors: ['#FDE047'], weight: 1 },
  ],
  leaves: [
    { shape: 'leaf', colors: ['#8DBF7A', '#A8D08D', '#6FA35E'], weight: 4 },
    { shape: 'petal', colors: ['#F1E2B8'], weight: 1 },
    { shape: 'sparkle', colors: ['#B9D9A8'], weight: 1 },
  ],
  lavender: [
    { shape: 'petal', colors: ['#B79CED', '#D7C8FA', '#9B7FDB'], weight: 4 },
    { shape: 'blossom', colors: ['#C4B5FD'], weight: 1 },
    { shape: 'sparkle', colors: ['#D8C4FB'], weight: 1 },
  ],
  candy: [
    { shape: 'confetti', colors: ['#F472B6', '#60A5FA', '#FBBF24', '#A78BFA'], weight: 3 },
    { shape: 'heart', colors: ['#F9A8D4'], weight: 1 },
    { shape: 'star', colors: ['#FCD34D', '#93C5FD'], weight: 1 },
  ],
  fairy: [
    { shape: 'petal', colors: ['#A7E3D3', '#C4B5FD'], weight: 2 },
    { shape: 'sparkle', colors: ['#7DD3C0', '#FDE68A'], weight: 3 },
    { shape: 'star', colors: ['#FDE68A'], weight: 1 },
  ],
  starlight: [
    { shape: 'star', colors: ['#FDE68A', '#E9D5FF'], weight: 2 },
    { shape: 'sparkle', colors: ['#FDE68A', '#C4B5FD', '#F5F3FF'], weight: 3 },
    { shape: 'dot', colors: ['#E9D5FF'], weight: 2 },
  ],
};

/** Theme nào dùng bộ nào khi chọn "Tự động theo Theme". */
const THEME_FALLING_SET: Record<string, string> = {
  'brown-beige': 'elegant',
  'tet-lunar': 'tet',
  'mid-autumn': 'mid-autumn',
  'christmas-noel': 'snow',
  'halloween-spooky': 'halloween',
  'valentine-love': 'love-bow',
  'womens-day': 'sakura',
  'new-year-firework': 'firework',
  'strawberry-milk': 'love-bow',
  'peach-blossom': 'sakura',
  'matcha-cream': 'leaves',
  'lavender-dream': 'lavender',
  'baby-cloud': 'star-bubble',
  'milk-tea': 'elegant',
  'kitty-pink': 'love-bow',
  'sweet-cherry': 'love-bow',
  'candy-land': 'candy',
  'cupcake-bakery': 'candy',
  'toy-shop': 'star-bubble',
  'disney-castle': 'starlight',
  'minnie-bow': 'love-bow',
  'fairy-butterfly': 'fairy',
  'rainbow-unicorn': 'star-bubble',
  'dark-velvet': 'elegant',
  'dark-espresso': 'elegant',
  'dark-galaxy': 'starlight',
};

/** Bộ hình hiển thị theo cài đặt (kiểu đã chọn, hoặc tự động theo theme). */
export function getFallingSet(settings: Pick<Settings, 'fallingStyle' | 'themePreset'>): FallingItemDef[] {
  const styleId = settings.fallingStyle || 'auto';
  if (styleId !== 'auto' && FALLING_SETS[styleId]) return FALLING_SETS[styleId];
  return FALLING_SETS[THEME_FALLING_SET[settings.themePreset] || 'elegant'];
}
