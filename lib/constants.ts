import type { Product, Settings } from './types';

// ======================== 1. DỮ LIỆU MẶC ĐỊNH & TỌA ĐỘ HÀ NỘI ========================
export const DEFAULT_CATEGORIES = [
  'Tất cả',
  '🆕 Hàng mới về',
  '🔥 Đang sale',
  'Hàng Order',
  'Sơn Gel',
  'Charm nail',
  'Phụ kiện ẩn móng',
  'Dụng cụ nail',
];

export const ORDER_CATEGORY = 'Hàng Order';
export const CANCELLED_STATUS = 'Đã hủy';

export const PLACEHOLDER_IMG = 'https://placehold.co/400x400/FAF5EF/7C583A?text=NailShop';
export const DEFAULT_PRODUCT_IMG =
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80';

export function createDefaultProducts(now = Date.now()): Product[] {
  return [
    {
      id: 'P001',
      name: 'Set Sơn Gel Mắt Mèo Kim Cương Siêu Sáng 12 Màu',
      category: 'Sơn Gel',
      price: 285000,
      oldPrice: 350000,
      comboPrice5: 265000,
      comboPrice10: 245000,
      inStock: true,
      isOrder: false,
      sold: 148,
      description:
        'Chất sơn gel đặc mịn, hạt từ tính bắt sáng cực nhạy chỉ sau 3 giây hơ nam châm. Tặng kèm thanh nam châm chuyên dụng.',
      images: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80'],
      variants: [
        { name: 'Full Set 12 Màu + Bảng Màu', price: 285000, image: '' },
        { name: 'Lẻ Chai Số 01 - Trắng Ngọc Trai', price: 29000, image: '' },
        { name: 'Lẻ Chai Số 05 - Hồng Thạch Anh', price: 29000, image: '' },
      ],
      updatedAt: now - 10000,
    },
    {
      id: 'P002',
      name: 'Hộp Charm Nơ & Đá Khối Pha Lê AB Cao Cấp (100 Viên)',
      category: 'Charm nail',
      price: 75000,
      oldPrice: 95000,
      comboPrice5: 68000,
      comboPrice10: 60000,
      inStock: true,
      isOrder: false,
      sold: 312,
      description:
        'Đá pha lê cắt giác sắc nét, đáy phẳng dễ gắn bằng gel đính đá chuyên dụng, giữ độ sáng bóng lâu dài không xỉn màu.',
      images: ['https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80'],
      variants: [
        { name: 'Mix 100 Viên Đa Dạng', price: 75000, image: '' },
        { name: 'Tone Trắng Trong AB', price: 75000, image: '' },
        { name: 'Tone Hồng Pastel', price: 79000, image: '' },
      ],
      updatedAt: now - 20000,
    },
    {
      id: 'P003',
      name: 'Set Xà Cừ Vân Đá & Giấy Nhún Vàng Ẩn Móng 12 Ô',
      category: 'Phụ kiện ẩn móng',
      price: 45000,
      oldPrice: 60000,
      comboPrice5: 40000,
      comboPrice10: 35000,
      inStock: true,
      isOrder: false,
      sold: 205,
      description: 'Mảnh xà cừ tự nhiên ép mỏng, dễ dàng ẩn gel tạo hiệu ứng chiều sâu sang trọng cho bộ móng.',
      images: ['https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80'],
      variants: [],
      updatedAt: now - 30000,
    },
    {
      id: 'P004',
      name: 'Máy Hơ Gel Sun X5 Plus 80W Cảm Ứng Tự Động',
      category: 'Dụng cụ nail',
      price: 195000,
      oldPrice: 250000,
      comboPrice5: 180000,
      comboPrice10: 165000,
      inStock: true,
      isOrder: false,
      sold: 89,
      description: '36 bóng LED UV kép hơ khô mọi loại sơn gel và gel đắp chỉ trong 30 giây, không làm đen da tay.',
      images: ['https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=80'],
      variants: [
        { name: 'Bản Tiêu Chuẩn Trắng', price: 195000, image: '' },
        { name: 'Bản Hồng Pastel', price: 205000, image: '' },
      ],
      updatedAt: now - 40000,
    },
    {
      id: 'P005',
      name: '[ORDER] Set Sơn Thạch Hàn Quốc Very Good Nail 36 Màu',
      category: 'Hàng Order',
      price: 1450000,
      oldPrice: 1650000,
      comboPrice5: 1380000,
      comboPrice10: 1320000,
      inStock: true,
      isOrder: true,
      sold: 27,
      description:
        'Hàng Order trực tiếp từ Hàn Quốc về sau 5-7 ngày. Chất sơn thạch trong veo chuẩn salon Seoul, kèm bảng màu mica.',
      images: ['https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=600&q=80'],
      variants: [{ name: 'Cọc 50% (725.000đ)', price: 1450000, image: '' }],
      updatedAt: now - 50000,
    },
  ];
}

export const DEFAULT_SETTINGS: Settings = {
  shopName: 'ViVi NailShop',
  tagline: 'Phụ kiện nail • Sơn gel • Máy hơ • Order nội địa',
  announcement: '✨ ViVi NailShop — Chuyên sỉ & lẻ phụ kiện, sơn gel, máy hơ & nhận Order hàng nội địa Trung/Hàn ✨',
  zaloPhone: '0987654321',
  shopDistrict: 'Đống Đa',
  shopWard: 'Ô Chợ Dừa',
  logoDataUrl: '',
  telegramToken: '',
  telegramChatId: '',
  themePreset: 'brown-beige',
  customBgColor: '#FAF5EF',
  bgPattern: 'none',
  fallingEnabled: true,
  fallingStyle: 'auto',
  fontFamily: "'Be Vietnam Pro', sans-serif",
  loyaltyGifts: [
    {
      id: 'G01',
      name: 'Dũa móng OPI 100/180 cao cấp',
      points: 50,
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'G02',
      name: 'Hũ gel đính đá siêu chắc 15ml',
      points: 120,
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'G03',
      name: 'Voucher giảm 50.000đ đơn tiếp theo',
      points: 200,
      image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=300&q=80',
    },
  ],
};

export interface HanoiDistrict {
  lat: number;
  lng: number;
  wards: Record<string, [number, number]>;
}

export const HANOI_DISTRICTS: Record<string, HanoiDistrict> = {
  'Hoàn Kiếm': { lat: 21.0285, lng: 105.8542, wards: { 'Hàng Bạc': [21.0345, 105.8532], 'Tràng Tiền': [21.0241, 105.8568], 'Cửa Nam': [21.0268, 105.8435], 'Hàng Gai': [21.0332, 105.8495] } },
  'Ba Đình': { lat: 21.0338, lng: 105.8142, wards: { 'Kim Mã': [21.0315, 105.8185], 'Giảng Võ': [21.0265, 105.8225], 'Ngọc Khánh': [21.0298, 105.8115], 'Liễu Giai': [21.0365, 105.8145] } },
  'Đống Đa': { lat: 21.0181, lng: 105.8292, wards: { 'Ô Chợ Dừa': [21.0195, 105.8275], 'Láng Hạ': [21.0152, 105.8148], 'Khâm Thiên': [21.0172, 105.8395], 'Trung Liệt': [21.0115, 105.8235], 'Thịnh Quang': [21.0058, 105.8205] } },
  'Hai Bà Trưng': { lat: 21.0091, lng: 105.8545, wards: { 'Bạch Mai': [21.0025, 105.8515], 'Phố Huế': [21.0135, 105.8522], 'Minh Khai': [20.9965, 105.8625], 'Vĩnh Tuy': [20.9995, 105.8735] } },
  'Cầu Giấy': { lat: 21.0362, lng: 105.7906, wards: { 'Dịch Vọng': [21.0355, 105.7925], 'Trung Hòa': [21.0125, 105.8015], 'Nghĩa Tân': [21.0435, 105.7915], 'Quan Hoa': [21.0342, 105.8012] } },
  'Thanh Xuân': { lat: 20.9938, lng: 105.8115, wards: { 'Nhân Chính': [21.0028, 105.8055], 'Khương Trung': [20.9965, 105.8185], 'Thanh Xuân Trung': [20.9945, 105.8085], 'Hạ Đình': [20.9895, 105.8085] } },
  'Tây Hồ': { lat: 21.0685, lng: 105.8182, wards: { 'Xuân La': [21.0682, 105.8045], 'Quảng An': [21.0655, 105.8245], 'Thụy Khuê': [21.0445, 105.8255], 'Nhật Tân': [21.0795, 105.8215] } },
  'Hoàng Mai': { lat: 20.9742, lng: 105.8548, wards: { 'Tân Mai': [20.9845, 105.8495], 'Giáp Bát': [20.9815, 105.8415], 'Hoàng Liệt': [20.9645, 105.8345], 'Định Công': [20.9785, 105.8315] } },
  'Long Biên': { lat: 21.0455, lng: 105.8925, wards: { 'Ngọc Lâm': [21.0465, 105.8745], 'Bồ Đề': [21.0385, 105.8785], 'Việt Hưng': [21.0595, 105.9065], 'Sài Đồng': [21.0355, 105.9125] } },
  'Nam Từ Liêm': { lat: 21.0185, lng: 105.7625, wards: { 'Mỹ Đình 1': [21.0235, 105.7745], 'Mỹ Đình 2': [21.0315, 105.7725], 'Mễ Trì': [21.0125, 105.7815], 'Trung Văn': [20.9965, 105.7895] } },
  'Bắc Từ Liêm': { lat: 21.0645, lng: 105.7585, wards: { 'Cổ Nhuế 1': [21.0565, 105.7815], 'Phú Diễn': [21.0435, 105.7625], 'Xuân Đỉnh': [21.0685, 105.7895] } },
  'Hà Đông': { lat: 20.9625, lng: 105.7695, wards: { 'Văn Quán': [20.9765, 105.7885], 'Mộ Lao': [20.9815, 105.7835], 'Quang Trung': [20.9685, 105.7745], 'Vạn Phúc': [20.9765, 105.7715] } },
};

export interface ThemePreset {
  id: string;
  name: string;
  bgMain: string;
  bgSoft: string;
  accent: string;
  dark: string;
  border: string;
  darkText: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'brown-beige', name: '🤎 Nâu Be Truyền Thống', bgMain: '#FAF5EF', bgSoft: '#F3EAE0', accent: '#7C583A', dark: '#4A3423', border: '#E4D5C3', darkText: false },
  { id: 'tet-lunar', name: '🧧 Tết Nguyên Đán Đỏ Vàng', bgMain: '#FFF5F5', bgSoft: '#FFE4E4', accent: '#C81E1E', dark: '#6E0D0D', border: '#F8B4B4', darkText: false },
  { id: 'mid-autumn', name: '🏮 Trung Thu Đèn Lồng', bgMain: '#FFF9EB', bgSoft: '#FDECC8', accent: '#C2410C', dark: '#5C1D04', border: '#F5C98B', darkText: false },
  { id: 'christmas-noel', name: '🎄 Giáng Sinh Noel Ấm Áp', bgMain: '#F4FBF6', bgSoft: '#E1F3E7', accent: '#15803D', dark: '#144525', border: '#B7DFC5', darkText: false },
  { id: 'halloween-spooky', name: '🎃 Halloween Bí Ngô', bgMain: '#1E1824', bgSoft: '#2B2233', accent: '#F97316', dark: '#FFF3E6', border: '#463754', darkText: true },
  { id: 'valentine-love', name: '💝 Valentine Ngọt Ngào', bgMain: '#FFF2F6', bgSoft: '#FFE0EA', accent: '#DB2777', dark: '#6B1039', border: '#F5B5CE', darkText: false },
  { id: 'womens-day', name: '💐 Lễ 8/3 & 20/10 Hoa Hồng', bgMain: '#FFF5FA', bgSoft: '#FCE4F2', accent: '#BE185D', dark: '#630C31', border: '#F2B8D8', darkText: false },
  { id: 'new-year-firework', name: '🎆 Năm Mới Pháo Hoa Đêm', bgMain: '#141929', bgSoft: '#1E263D', accent: '#EAB308', dark: '#FEFCE8', border: '#344166', darkText: true },
  { id: 'strawberry-milk', name: '🍓 Dâu Tây Sữa', bgMain: '#FFF5F7', bgSoft: '#FFE8EE', accent: '#E14D72', dark: '#7A1E37', border: '#F8C6D4', darkText: false },
  { id: 'peach-blossom', name: '🍑 Đào Tiên Phấn Hồng', bgMain: '#FFF7F2', bgSoft: '#FFEBE0', accent: '#E06D4B', dark: '#752D18', border: '#F7CBB8', darkText: false },
  { id: 'matcha-cream', name: '🍵 Matcha Kem Sữa', bgMain: '#F5F9F2', bgSoft: '#E7F2E1', accent: '#558B46', dark: '#27471E', border: '#C9DFC0', darkText: false },
  { id: 'lavender-dream', name: '🪻 Oải Hương Mộng Mơ', bgMain: '#F8F5FF', bgSoft: '#EDE6FF', accent: '#7C5AC2', dark: '#3B236E', border: '#D7C8FA', darkText: false },
  { id: 'baby-cloud', name: '☁️ Mây Xanh Baby', bgMain: '#F2F9FF', bgSoft: '#E2F1FF', accent: '#3B82C4', dark: '#18426B', border: '#BFDDF8', darkText: false },
  { id: 'milk-tea', name: '🧋 Trà Sữa Trân Châu', bgMain: '#FBF6F0', bgSoft: '#F2E5D5', accent: '#9C6B3E', dark: '#543518', border: '#DFC7AC', darkText: false },
  { id: 'kitty-pink', name: '🐾 Mèo Con Chân Hồng', bgMain: '#FFF6FA', bgSoft: '#FFE6F2', accent: '#D94B8C', dark: '#731A43', border: '#F5C2D9', darkText: false },
  { id: 'sweet-cherry', name: '🍒 Anh Đào Ngọt Ngào', bgMain: '#FFF4F6', bgSoft: '#FFE3E8', accent: '#C8234C', dark: '#690D24', border: '#F2B8C6', darkText: false },
  { id: 'candy-land', name: '🍭 Kẹo Ngọt Candy', bgMain: '#FFF5FB', bgSoft: '#FDE4F5', accent: '#D6339B', dark: '#6E124D', border: '#F4BCE2', darkText: false },
  { id: 'cupcake-bakery', name: '🧁 Tiệm Bánh Cupcake', bgMain: '#FFF9F0', bgSoft: '#FCECD6', accent: '#C97B2B', dark: '#63380E', border: '#EED2AE', darkText: false },
  { id: 'toy-shop', name: '🧸 Cửa Hàng Đồ Chơi', bgMain: '#F4F8FF', bgSoft: '#E3EEFF', accent: '#2B6CB0', dark: '#153963', border: '#BDD4F5', darkText: false },
  { id: 'disney-castle', name: '🏰 Lâu Đài Cổ Tích Disney', bgMain: '#F6F4FF', bgSoft: '#E8E3FF', accent: '#5A4FCF', dark: '#282070', border: '#C9C2F7', darkText: false },
  { id: 'minnie-bow', name: '🎀 Chuột Nơ Chấm Bi', bgMain: '#FFF4F6', bgSoft: '#FFE0E6', accent: '#D92648', dark: '#6E0E21', border: '#F5B5C2', darkText: false },
  { id: 'fairy-butterfly', name: '🧚 Tiên Bướm Phép Thuật', bgMain: '#F3FBF9', bgSoft: '#E0F5F0', accent: '#2A8C7A', dark: '#124A40', border: '#B6E3DA', darkText: false },
  { id: 'rainbow-unicorn', name: '🦄 Kỳ Lân Cầu Vồng', bgMain: '#FAF5FF', bgSoft: '#F2E5FF', accent: '#9B4DCA', dark: '#4B1D69', border: '#DEC2F5', darkText: false },
  { id: 'dark-velvet', name: '🌑 Đen Nhung Huyền Bí', bgMain: '#181619', bgSoft: '#242026', accent: '#D4A373', dark: '#F5EFEA', border: '#3A333D', darkText: true },
  { id: 'dark-espresso', name: '🤎 Nâu Cà Phê Đậm', bgMain: '#211915', bgSoft: '#2E231D', accent: '#DDA15E', dark: '#F7EDE2', border: '#47362D', darkText: true },
  { id: 'dark-galaxy', name: '🌌 Tím Đêm Ngân Hà', bgMain: '#191629', bgSoft: '#241F3B', accent: '#B388EB', dark: '#F3EEFF', border: '#3B335E', darkText: true },
];

export const BG_PATTERNS = [
  { id: 'none', name: '✨ Nền trơn mịn' },
  { id: 'pattern-tet-blossom', name: '🎋 Hoa Mai & Đào Tết' },
  { id: 'pattern-lanterns', name: '🏮 Đèn Lồng Trung Thu' },
  { id: 'pattern-snowflakes', name: '❄️ Bông Tuyết Noel' },
  { id: 'pattern-halloween', name: '🎃 Bí Ngô Halloween' },
  { id: 'pattern-clover', name: '🍀 Cỏ Bốn Lá May Mắn' },
  { id: 'pattern-bubbles', name: '🫧 Bong Bóng Pastel' },
  { id: 'pattern-rainbows', name: '🌈 Cầu Vồng Nhỏ' },
  { id: 'pattern-crowns', name: '👑 Vương Miện Công Chúa' },
  { id: 'pattern-dots', name: '⚪ Chấm bi kẹo ngọt' },
  { id: 'pattern-gingham', name: '🧺 Kẻ caro Gingham' },
  { id: 'pattern-hearts', name: '💕 Trái tim nhỏ' },
  { id: 'pattern-stars', name: '✨ Ngôi sao lấp lánh' },
  { id: 'pattern-bows', name: '🎀 Ruy băng nơ xinh' },
  { id: 'pattern-sakura', name: '🌸 Hoa anh đào' },
  { id: 'pattern-paws', name: '🐾 Chân mèo cute' },
  { id: 'pattern-cherries', name: '🍒 Trái cherry ngọt' },
  { id: 'pattern-butterflies', name: '🦋 Bướm tiên mơ mộng' },
  { id: 'pattern-moons', name: '🌙 Trăng sao đêm' },
  { id: 'pattern-gold-lattice', name: '🟨 Lưới vàng sang' },
  { id: 'pattern-diamonds', name: '💎 Kim cương sang' },
  { id: 'pattern-checker', name: '🏁 Bàn cờ pastel' },
  { id: 'pattern-waves', name: '🌊 Sóng mây bồng bềnh' },
  { id: 'pattern-glitter', name: '🌟 Lưới kim tuyến tối' },
];

export const BG_SWATCHES = [
  { name: '🤎 Be Kem Sữa', hex: '#FAF5EF' },
  { name: '🍓 Hồng Dâu Sữa', hex: '#FFF5F7' },
  { name: '🍑 Đào Phấn Hồng', hex: '#FFF7F2' },
  { name: '🍵 Matcha Kem', hex: '#F5F9F2' },
  { name: '🪻 Oải Hương Nhạt', hex: '#F8F5FF' },
  { name: '☁️ Mây Xanh Baby', hex: '#F2F9FF' },
  { name: '🌑 Đen Nhung Tối', hex: '#181619' },
  { name: '🤎 Cà Phê Đậm', hex: '#211915' },
  { name: '🌌 Tím Ngân Hà', hex: '#191629' },
];

/** Kiểu hiệu ứng rơi (hình SVG & màu nằm ở lib/falling.ts). */
export const FALLING_ICON_STYLES = [
  { id: 'auto', name: 'Tự động theo Theme' },
  { id: 'sakura', name: 'Hoa Anh Đào' },
  { id: 'tet', name: 'Mai Đào Tết' },
  { id: 'snow', name: 'Tuyết Noel' },
  { id: 'mid-autumn', name: 'Đèn Lồng Trung Thu' },
  { id: 'halloween', name: 'Bí Ngô Halloween' },
  { id: 'love-bow', name: 'Nơ & Trái Tim' },
  { id: 'star-bubble', name: 'Sao & Bong Bóng' },
  { id: 'leaves', name: 'Lá Xanh Nhẹ' },
  { id: 'lavender', name: 'Cánh Hoa Oải Hương' },
  { id: 'firework', name: 'Pháo Hoa Lấp Lánh' },
  { id: 'elegant', name: 'Cánh Hoa Thanh Lịch' },
];

/** Giá trị lưu trong settings.fontFamily giữ nguyên như bản HTML cũ để file sao lưu tương thích. */
export const FONT_OPTIONS = [
  { value: "'Be Vietnam Pro', sans-serif", label: 'Be Vietnam Pro (Hiện đại, rõ nét)', css: 'var(--font-be-vietnam), sans-serif' },
  { value: "'Quicksand', sans-serif", label: 'Quicksand (Tròn trịa, dễ thương)', css: 'var(--font-quicksand), sans-serif' },
  { value: "'Playfair Display', serif", label: 'Playfair Display (Sang trọng, cổ điển)', css: 'var(--font-playfair), serif' },
];

export const PAYMENT_METHODS = [
  { value: 'Thanh toán khi nhận hàng (COD)', label: '💵 Thanh toán khi nhận (COD)' },
  { value: 'Chuyển khoản ngân hàng / QR', label: '🏦 Chuyển khoản / Quét mã QR' },
];
