import { EinkPreset } from '../types';

export interface EinkBrand {
  id: string;
  name: string;
  count?: number;
}

export const EINK_BRANDS: EinkBrand[] = [
  { id: 'all', name: 'All Brands' },
  { id: 'Amazon Kindle', name: 'Amazon Kindle' },
  { id: 'Kobo', name: 'Kobo' },
  { id: 'Onyx Boox', name: 'Onyx Boox' },
  { id: 'Dasung', name: 'Dasung' },
  { id: 'Hisense', name: 'Hisense' },
  { id: 'reMarkable', name: 'reMarkable' },
  { id: 'XTeink', name: 'XTeink' },
  { id: 'Yota', name: 'Yota (Yotaphone)' },
  { id: 'Eewriter', name: 'Eewriter' },
  { id: 'Pixel Qi', name: 'Pixel Qi' },
  { id: 'PocketBook', name: 'PocketBook / Universal' },
];

export const EINK_DEVICE_PRESETS: EinkPreset[] = [
  // --- UNIVERSAL & STANDARD ---
  {
    id: 'universal_ereader',
    name: 'Universal E-Reader (3:4 Standard)',
    brand: 'PocketBook',
    resolution: { width: 1200, height: 1600 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1200 x 1600 px',
    description: 'Gold standard 3:4 aspect ratio compatible with Kindle, Kobo, Boox, Tolino, and PocketBook.',
    isDefault: true,
  },

  // --- AMAZON KINDLE ---
  {
    id: 'kindle_paperwhite',
    name: 'Kindle Paperwhite (6.8" Carta 1200)',
    brand: 'Amazon Kindle',
    resolution: { width: 1236, height: 1648 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1236 x 1648 px',
    description: 'Kindle Paperwhite 11th Gen with 6.8" 300 PPI display with adjustable warm light.',
  },
  {
    id: 'kindle_oasis',
    name: 'Kindle Oasis (7.0" Ergonomic Glass)',
    brand: 'Amazon Kindle',
    resolution: { width: 1264, height: 1680 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1264 x 1680 px',
    description: 'Kindle Oasis 7.0" 300 PPI display with physical turn buttons and aluminum chassis.',
  },
  {
    id: 'kindle_basic',
    name: 'Kindle Basic 2024 / 2022 (6.0" Compact)',
    brand: 'Amazon Kindle',
    resolution: { width: 1072, height: 1448 },
    aspectRatio: '3:4 (0.74)',
    recommendedCoverSize: '1072 x 1448 px',
    description: 'Entry-level Kindle with 6.0" glare-free 300 PPI high-contrast display.',
  },
  {
    id: 'kindle_scribe',
    name: 'Kindle Scribe (10.2" Large Canvas & Pen)',
    brand: 'Amazon Kindle',
    resolution: { width: 1860, height: 2480 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1860 x 2480 px',
    description: 'Kindle Scribe 10.2" 300 PPI digital notebook and textbook e-reader.',
  },
  {
    id: 'kindle_colorsoft',
    name: 'Kindle Colorsoft Signature (7.0" Color)',
    brand: 'Amazon Kindle',
    resolution: { width: 1264, height: 1680 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1264 x 1680 px',
    description: 'Colorsoft 7.0" with Colorsoft e-ink display for vibrant color covers.',
  },

  // --- KOBO ---
  {
    id: 'kobo_sage',
    name: 'Kobo Sage (8.0" Flush Screen & Stylus)',
    brand: 'Kobo',
    resolution: { width: 1440, height: 1920 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1440 x 1920 px',
    description: '8.0" HD Carta 1200 300 PPI display with quad-core processor and audio support.',
  },
  {
    id: 'kobo_elipsa_2e',
    name: 'Kobo Elipsa 2E (10.3" E-Note Notebook)',
    brand: 'Kobo',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: '10.3" large-format digital notebook for PDFs, academic papers, and reading.',
  },
  {
    id: 'kobo_libra',
    name: 'Kobo Libra (7.0" Libra 2 / Colour / H2O)',
    brand: 'Kobo',
    resolution: { width: 1264, height: 1680 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1264 x 1680 px',
    description: '7.0" E-Ink Carta 1200 / Kaleido 3 display with ergonomic grip and physical buttons.',
  },
  {
    id: 'kobo_clara_colour',
    name: 'Kobo Clara (6.0" Colour / 2E / HD)',
    brand: 'Kobo',
    resolution: { width: 1072, height: 1448 },
    aspectRatio: '3:4 (0.74)',
    recommendedCoverSize: '1072 x 1448 px',
    description: '6.0" 300 PPI pocket e-reader made from recycled and ocean-bound plastics.',
  },

  // --- ONYX BOOX ---
  {
    id: 'onyx_boox_note_3',
    name: 'Onyx Boox Note 3 (10.3" Android E-Note)',
    brand: 'Onyx Boox',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: '10.3" 227 PPI Mobius Carta screen, Snapdragon 636, and Android 10 stylus e-reader.',
  },
  {
    id: 'onyx_boox_note_2',
    name: 'Onyx Boox Note 2 (10.3" Frontlit E-Ink)',
    brand: 'Onyx Boox',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: '10.3" 227 PPI Carta e-paper display with dual-touch and frontlight temperature control.',
  },
  {
    id: 'onyx_boox_note',
    name: 'Onyx Boox Note (10.3" Lightweight Mobius)',
    brand: 'Onyx Boox',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: 'Original lightweight 10.3" Mobius flexible e-ink screen with Wacom stylus support.',
  },
  {
    id: 'onyx_boox_max_3',
    name: 'Onyx Boox Max 3 (13.3" A4 Pro Display & HDMI)',
    brand: 'Onyx Boox',
    resolution: { width: 2200, height: 1650 },
    aspectRatio: '4:3 (1.33)',
    recommendedCoverSize: '2200 x 1650 px',
    description: '13.3" 207 PPI large-format Carta screen with micro-HDMI secondary monitor mode.',
  },
  {
    id: 'onyx_boox_max_2',
    name: 'Onyx Boox Max 2 (13.3" Dual Mode E-Ink)',
    brand: 'Onyx Boox',
    resolution: { width: 2200, height: 1650 },
    aspectRatio: '4:3 (1.33)',
    recommendedCoverSize: '2200 x 1650 px',
    description: '13.3" flexible Mobius e-ink display with HDMI input and dual touch finger/pen.',
  },
  {
    id: 'onyx_boox_palma',
    name: 'Onyx Boox Palma / Palma 2 (6.13" Phone)',
    brand: 'Onyx Boox',
    resolution: { width: 824, height: 1648 },
    aspectRatio: '1:2 (0.50)',
    recommendedCoverSize: '824 x 1648 px',
    description: '6.13" 300 PPI Carta 1200 phone-sized ultra-mobile Android e-ink reader.',
  },
  {
    id: 'onyx_boox_page',
    name: 'Onyx Boox Page / Leaf 3 (7.0" Carta 1200)',
    brand: 'Onyx Boox',
    resolution: { width: 1264, height: 1680 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1264 x 1680 px',
    description: '7.0" 300 PPI Android e-reader with ergonomic grip and physical buttons.',
  },
  {
    id: 'onyx_boox_go_color7',
    name: 'Onyx Boox Go Color 7 (7.0" Kaleido 3)',
    brand: 'Onyx Boox',
    resolution: { width: 1264, height: 1680 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1264 x 1680 px',
    description: '7.0" color e-ink Android tablet with BSR refresh technology.',
  },
  {
    id: 'onyx_boox_go_103',
    name: 'Onyx Boox Go 10.3 (10.3" 300 PPI Ultra-Thin)',
    brand: 'Onyx Boox',
    resolution: { width: 1860, height: 2480 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1860 x 2480 px',
    description: '10.3" ultra-slim 4.6mm aluminum body with high-density 300 PPI Carta display.',
  },
  {
    id: 'onyx_boox_note_air3',
    name: 'Onyx Boox Note Air 3 / Air 3 C (10.3")',
    brand: 'Onyx Boox',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: '10.3" Android e-notebook with magnetic stylus and asymmetric bezel.',
  },

  // --- DASUNG ---
  {
    id: 'dasung_paperlike_253',
    name: 'Paperlike 253 (25" 3.2K Large Monitor)',
    brand: 'Dasung',
    resolution: { width: 3200, height: 1800 },
    aspectRatio: '16:9 (1.78)',
    recommendedCoverSize: '3200 x 1800 px',
    description: '25.3" 3200×1800 16:9 high-speed desktop E-Ink monitor with Turbo refresh.',
  },
  {
    id: 'dasung_paperlike_pro_hdf',
    name: 'Dasung Paperlike Pro HD-F (4th gen, 2019)',
    brand: 'Dasung',
    resolution: { width: 2200, height: 1650 },
    aspectRatio: '4:3 (1.33)',
    recommendedCoverSize: '2200 x 1650 px',
    description: '13.3" 2200×1650 high-definition Carta e-ink screen with frontlight and HDMI input.',
  },
  {
    id: 'dasung_paperlike_pro_2nd_gen',
    name: 'Dasung Paperlike Pro (2nd gen)',
    brand: 'Dasung',
    resolution: { width: 1600, height: 1200 },
    aspectRatio: '4:3 (1.33)',
    recommendedCoverSize: '1600 x 1200 px',
    description: '13.3" 1600×1200 second-generation Carta E-Ink monitor with HDMI connection.',
  },
  {
    id: 'dasung_not_ereader_103',
    name: 'Dasung Not-eReader 103 (10.3" Android Tablet)',
    brand: 'Dasung',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: '10.3" ultra-fast refresh e-ink tablet for web browsing, video, and documents.',
  },
  {
    id: 'dasung_link',
    name: 'Dasung Link (6.7" Smartphone E-Ink Screen)',
    brand: 'Dasung',
    resolution: { width: 824, height: 1648 },
    aspectRatio: '1:2 (0.50)',
    recommendedCoverSize: '824 x 1648 px',
    description: '6.7" 300 PPI wireless phone-screen projection monitor in aluminum housing.',
  },

  // --- HISENSE ---
  {
    id: 'hisense_a2_pro',
    name: 'Hisense A2 Pro (5.2" Dual Screen E-Ink)',
    brand: 'Hisense',
    resolution: { width: 540, height: 960 },
    aspectRatio: '9:16 (0.56)',
    recommendedCoverSize: '540 x 960 px',
    description: '5.2" qHD 540×960 rear E-Ink screen on dual-screen smartphone with physical reader mode.',
  },
  {
    id: 'hisense_a6',
    name: 'Hisense A6 (5.61" Dual Screen E-Ink)',
    brand: 'Hisense',
    resolution: { width: 720, height: 1440 },
    aspectRatio: '1:2 (0.50)',
    recommendedCoverSize: '720 x 1440 px',
    description: '5.61" HD+ 720×1440 287 PPI rear Carta E-Ink screen with frontlight and infrared remote.',
  },
  {
    id: 'hisense_a9',
    name: 'Hisense A9 / A9 Pro (6.1" Carta 1200 HiFi)',
    brand: 'Hisense',
    resolution: { width: 824, height: 1648 },
    aspectRatio: '1:2 (0.50)',
    recommendedCoverSize: '824 x 1648 px',
    description: '6.1" 300 PPI Carta 1200 screen, ES9318 Hi-Fi DAC, and 36-level warm frontlight.',
  },
  {
    id: 'hisense_touch',
    name: 'Hisense Touch / Touch Lite (5.84" Pocket HiFi)',
    brand: 'Hisense',
    resolution: { width: 720, height: 1440 },
    aspectRatio: '1:2 (0.50)',
    recommendedCoverSize: '720 x 1440 px',
    description: '5.84" 276 PPI e-ink music player and pocket e-book reader with aluminum unibody.',
  },
  {
    id: 'hisense_a7_cc',
    name: 'Hisense A7 / A7 CC (6.7" Color E-Ink)',
    brand: 'Hisense',
    resolution: { width: 900, height: 1800 },
    aspectRatio: '1:2 (0.50)',
    recommendedCoverSize: '900 x 1800 px',
    description: '6.7" high-resolution e-ink smartphone with 5G connectivity and Kaleido screen.',
  },
  {
    id: 'hisense_hi_reader',
    name: 'Hisense Hi Reader / Hi Reader Pro (6.7")',
    brand: 'Hisense',
    resolution: { width: 900, height: 1800 },
    aspectRatio: '1:2 (0.50)',
    recommendedCoverSize: '900 x 1800 px',
    description: '6.7" 300 PPI ultra-light e-reader with flat glass bezel and octa-core CPU.',
  },

  // --- YOTAPHONE ---
  {
    id: 'yotaphone_3_plus',
    name: 'Yotaphone 3+ (5.2" Rear Carta E-Ink HD)',
    brand: 'Yota',
    resolution: { width: 720, height: 1280 },
    aspectRatio: '9:16 (0.56)',
    recommendedCoverSize: '720 x 1280 px',
    description: '5.2" 720×1280 282 PPI rear Carta E-Ink touch display on dual-screen smartphone with YotaOS.',
  },
  {
    id: 'yotaphone_2',
    name: 'Yotaphone 2 (4.7" Always-On E-Ink Display)',
    brand: 'Yota',
    resolution: { width: 540, height: 960 },
    aspectRatio: '9:16 (0.56)',
    recommendedCoverSize: '540 x 960 px',
    description: '4.7" 540×960 235 PPI always-on curved E-Ink back screen with 16-level grayscale.',
  },

  // --- EEWRITER ---
  {
    id: 'eewriter_e_pad',
    name: 'Eewriter E-Pad (10.3" 4G Android E-Note)',
    brand: 'Eewriter',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: '10.3" 1404×1872 227 PPI Mobius Carta screen, 4G LTE, Helio X20 ten-core CPU, and WACOM stylus.',
  },

  // --- PIXEL QI ---
  {
    id: 'pixel_qi_10',
    name: 'Pixel Qi (10.1" Sunlight Transflective 3Qi)',
    brand: 'Pixel Qi',
    resolution: { width: 1024, height: 600 },
    aspectRatio: '16:10 (1.71)',
    recommendedCoverSize: '1024 x 600 px',
    description: '10.1" 1024×600 transflective daylight-readable 3Qi dual-mode (e-paper B&W reflective / color LCD).',
  },

  // --- XTEINK ---
  {
    id: 'xteink_x4_pro',
    name: 'XTeink X4 Pro (4.3" Frontlit & Touch)',
    brand: 'XTeink',
    resolution: { width: 480, height: 800 },
    aspectRatio: '3:5 (0.60)',
    recommendedCoverSize: '960 x 1600 px',
    description: 'XTeink X4 Pro with 4.3" 219 PPI Carta display, dual warm/cool frontlight, and touch + buttons.',
  },
  {
    id: 'xteink_x4',
    name: 'XTeink X4 (4.3" Daylight Pocket)',
    brand: 'XTeink',
    resolution: { width: 480, height: 800 },
    aspectRatio: '3:5 (0.60)',
    recommendedCoverSize: '960 x 1600 px',
    description: 'XTeink X4 with 4.3" 220 PPI Carta display and dedicated physical page-turn buttons.',
  },
  {
    id: 'xteink_x3',
    name: 'XTeink X3 (3.7" Ultra-Pocket Mini)',
    brand: 'XTeink',
    resolution: { width: 480, height: 800 },
    aspectRatio: '3:5 (0.60)',
    recommendedCoverSize: '960 x 1600 px',
    description: 'XTeink X3 with ultra-compact 3.7" 259 PPI high-density e-ink screen with physical controls.',
  },

  // --- REMARKABLE ---
  {
    id: 'remarkable_paper_pro',
    name: 'reMarkable Paper Pro (11.8" Canvas Color)',
    brand: 'reMarkable',
    resolution: { width: 1620, height: 2160 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1620 x 2160 px',
    description: '11.8" Canvas Color display with built-in frontlight and responsive pen latency.',
  },
  {
    id: 'remarkable_2',
    name: 'reMarkable 2 (10.3" Canvas Paperlike)',
    brand: 'reMarkable',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: '10.3" monochrome digital paper tablet with paper-feel friction surface.',
  },

  // --- POCKETBOOK ---
  {
    id: 'pocketbook_era',
    name: 'PocketBook Era / Color (7.0" Carta 1200)',
    brand: 'PocketBook',
    resolution: { width: 1264, height: 1680 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1264 x 1680 px',
    description: '7.0" side-grip e-reader with SMARTlight, audio Bluetooth, and IPX8 water protection.',
  },
  {
    id: 'pocketbook_inkpad_color3',
    name: 'PocketBook InkPad Color 3 (7.8" Kaleido 3)',
    brand: 'PocketBook',
    resolution: { width: 1404, height: 1872 },
    aspectRatio: '3:4 (0.75)',
    recommendedCoverSize: '1404 x 1872 px',
    description: '7.8" large-screen e-reader with Kaleido 3 color screen and dual-core processor.',
  },
];

export function getPresetsByBrand(brand: string): EinkPreset[] {
  if (!brand || brand === 'all') {
    return EINK_DEVICE_PRESETS;
  }
  return EINK_DEVICE_PRESETS.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
}

export const DEFAULT_COVER_TUNING = {
  contrast: 15,
  brightness: 0,
  gamma: 1.1,
  grayscaleMode: 'none' as const,
  aspectRatioPreset: 'universal_ereader',
};

export const RENAMING_PRESETS = [
  { label: '[Author] - [Title]', pattern: '{author} - {title}' },
  { label: '[Title] - [Author]', pattern: '{title} - {author}' },
  { label: '[Series] #[Index] - [Title] ([Author])', pattern: '{series} #{seriesIndex} - {title} ({author})' },
  { label: '[Series] [Index] - [Title]', pattern: '{series} {seriesIndex} - {title}' },
  { label: '[Author] - [Series] [Index] - [Title]', pattern: '{author} - {series} {seriesIndex} - {title}' },
  { label: '[Title]', pattern: '{title}' },
];

