import { CoverTuning, TypographyCoverOptions } from '../types';
import { EINK_DEVICE_PRESETS } from './presets';

const EINK_16_LEVELS = [
  0, 17, 34, 51, 68, 85, 102, 119, 136, 153, 170, 187, 204, 221, 238, 255
];

function findNearestEinkLevel(val: number): number {
  let closest = EINK_16_LEVELS[0];
  let minDiff = Math.abs(val - closest);
  for (let i = 1; i < EINK_16_LEVELS.length; i++) {
    const diff = Math.abs(val - EINK_16_LEVELS[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = EINK_16_LEVELS[i];
    }
  }
  return closest;
}

/**
 * Loads an image from a URL or DataURL.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
}

/**
 * Processes a cover image with target dimensions, contrast, brightness, gamma, and e-ink grayscale/dithering.
 */
export async function processCoverImage(
  sourceDataUrl: string,
  tuning: CoverTuning,
  targetPresetId?: string
): Promise<{ dataUrl: string; uint8Array: Uint8Array; width: number; height: number; mimeType: string }> {
  const img = await loadImage(sourceDataUrl);

  const preset = EINK_DEVICE_PRESETS.find(p => p.id === (targetPresetId || tuning.aspectRatioPreset)) || EINK_DEVICE_PRESETS[2]; // Universal 1200x1600
  
  const targetWidth = tuning.customWidth || preset.resolution.width * (preset.resolution.width < 800 ? 2 : 1);
  const targetHeight = tuning.customHeight || preset.resolution.height * (preset.resolution.height < 1000 ? 2 : 1);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Fill background with clean neutral to prevent transparent holes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Compute cover crop (cover mode: fill canvas maintaining aspect ratio, centered)
  const imgAspect = img.width / img.height;
  const targetAspect = targetWidth / targetHeight;

  let renderWidth = targetWidth;
  let renderHeight = targetHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imgAspect > targetAspect) {
    // Image is wider than target: fit height, crop width
    renderHeight = targetHeight;
    renderWidth = targetHeight * imgAspect;
    offsetX = (targetWidth - renderWidth) / 2;
  } else {
    // Image is taller than target: fit width, crop height
    renderWidth = targetWidth;
    renderHeight = targetWidth / imgAspect;
    offsetY = (targetHeight - renderHeight) / 2;
  }

  // Draw image with high quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

  // Get pixel buffer for pixel-level e-ink tuning
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  // Apply Brightness, Contrast, Gamma
  const contrastFactor = (259 * (tuning.contrast + 255)) / (255 * (259 - tuning.contrast));
  const brightness = tuning.brightness;
  const gamma = Math.max(0.2, tuning.gamma || 1.0);

  // First pass: contrast, brightness, gamma & luminance calculation
  const width = targetWidth;
  const height = targetHeight;
  const grayBuffer = new Float32Array(width * height);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    r = Math.min(255, Math.max(0, r + brightness));
    g = Math.min(255, Math.max(0, g + brightness));
    b = Math.min(255, Math.max(0, b + brightness));

    // Contrast
    r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
    g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
    b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));

    // Gamma
    r = Math.min(255, Math.max(0, 255 * Math.pow(r / 255, 1 / gamma)));
    g = Math.min(255, Math.max(0, 255 * Math.pow(g / 255, 1 / gamma)));
    b = Math.min(255, Math.max(0, 255 * Math.pow(b / 255, 1 / gamma)));

    // Standard Rec.709 perceived luminance
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    grayBuffer[i / 4] = lum;

    // Store back color in case grayscale is not active
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  // Handle Grayscale / Dithering modes
  if (tuning.grayscaleMode === 'eink_16_gray') {
    // Quantize directly to 16 e-ink levels
    for (let i = 0; i < data.length; i += 4) {
      const lum = grayBuffer[i / 4];
      const q = findNearestEinkLevel(lum);
      data[i] = q;
      data[i + 1] = q;
      data[i + 2] = q;
    }
  } else if (tuning.grayscaleMode === 'floyd_steinberg') {
    // Floyd-Steinberg error diffusion onto 16-level e-ink
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = grayBuffer[idx];
        const newVal = findNearestEinkLevel(oldVal);
        grayBuffer[idx] = newVal;
        const err = oldVal - newVal;

        if (x + 1 < width) grayBuffer[idx + 1] += err * (7 / 16);
        if (x - 1 >= 0 && y + 1 < height) grayBuffer[(y + 1) * width + (x - 1)] += err * (3 / 16);
        if (y + 1 < height) grayBuffer[(y + 1) * width + x] += err * (5 / 16);
        if (x + 1 < width && y + 1 < height) grayBuffer[(y + 1) * width + (x + 1)] += err * (1 / 16);
      }
    }
    for (let i = 0; i < data.length; i += 4) {
      const q = Math.min(255, Math.max(0, grayBuffer[i / 4]));
      data[i] = q;
      data[i + 1] = q;
      data[i + 2] = q;
    }
  } else if (tuning.grayscaleMode === 'atkinson_dither') {
    // Atkinson Dithering (Apple / Hypercard style)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = grayBuffer[idx];
        const newVal = findNearestEinkLevel(oldVal);
        grayBuffer[idx] = newVal;
        const err = (oldVal - newVal) / 8;

        if (x + 1 < width) grayBuffer[idx + 1] += err;
        if (x + 2 < width) grayBuffer[idx + 2] += err;
        if (x - 1 >= 0 && y + 1 < height) grayBuffer[(y + 1) * width + (x - 1)] += err;
        if (y + 1 < height) grayBuffer[(y + 1) * width + x] += err;
        if (x + 1 < width && y + 1 < height) grayBuffer[(y + 1) * width + (x + 1)] += err;
        if (y + 2 < height) grayBuffer[(y + 2) * width + x] += err;
      }
    }
    for (let i = 0; i < data.length; i += 4) {
      const q = Math.min(255, Math.max(0, grayBuffer[i / 4]));
      data[i] = q;
      data[i + 1] = q;
      data[i + 2] = q;
    }
  } else if (tuning.grayscaleMode === 'high_contrast') {
    // 1-bit high contrast monochrome threshold with edge preservation
    for (let i = 0; i < data.length; i += 4) {
      const lum = grayBuffer[i / 4];
      const q = lum > 135 ? 255 : 0;
      data[i] = q;
      data[i + 1] = q;
      data[i + 2] = q;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.92));
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  return {
    dataUrl,
    uint8Array,
    width: targetWidth,
    height: targetHeight,
    mimeType: 'image/jpeg',
  };
}

/**
 * Creates an elegant typography-based book cover on Canvas.
 */
export async function generateTypographyCover(options: TypographyCoverOptions): Promise<string> {
  const width = 1200;
  const height = 1600;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  // Background
  ctx.fillStyle = options.backgroundColor || '#1c1d22';
  ctx.fillRect(0, 0, width, height);

  // Border & Frames
  const pad = 60;
  ctx.strokeStyle = options.accentColor || '#e2b144';
  ctx.lineWidth = 4;

  if (options.borderStyle === 'ornate_double') {
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad + 16, pad + 16, width - (pad + 16) * 2, height - (pad + 16) * 2);

    // Decorative corner diamonds
    const corners = [
      [pad + 8, pad + 8],
      [width - pad - 8, pad + 8],
      [pad + 8, height - pad - 8],
      [width - pad - 8, height - pad - 8],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillStyle = options.accentColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (options.borderStyle === 'minimal_frame') {
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  } else if (options.borderStyle === 'vintage_corner') {
    ctx.lineWidth = 3;
    const clen = 80;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(pad, pad + clen);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + clen, pad);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - pad - clen, pad);
    ctx.lineTo(width - pad, pad);
    ctx.lineTo(width - pad, pad + clen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(pad, height - pad - clen);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(pad + clen, height - pad);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - pad - clen, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad, height - pad - clen);
    ctx.stroke();
  } else if (options.borderStyle === 'eink_solid_frame') {
    ctx.lineWidth = 12;
    ctx.strokeRect(pad / 2, pad / 2, width - pad, height - pad);
  }

  // Draw Series badge if provided
  if (options.series) {
    ctx.fillStyle = options.accentColor;
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const seriesText = options.seriesIndex ? `${options.series.toUpperCase()} · BOOK ${options.seriesIndex}` : options.series.toUpperCase();
    ctx.fillText(seriesText, width / 2, 280);

    // Decorative line below series
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, 310);
    ctx.lineTo(width / 2 + 120, 310);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = options.accentColor;
    ctx.stroke();
  }

  // Draw Title (Word wrap & adaptive font size)
  ctx.fillStyle = options.textColor || '#ffffff';
  ctx.textAlign = 'center';

  const title = options.title || 'Untitled';
  let titleFontSize = title.length > 50 ? 56 : title.length > 25 ? 72 : 88;
  ctx.font = `600 ${titleFontSize}px "Newsreader", serif`;

  const maxWidth = width - 240;
  const words = title.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = titleFontSize * 1.25;
  const totalTitleHeight = lines.length * lineHeight;
  let startY = height / 2 - totalTitleHeight / 2 - (options.subtitle ? 40 : 0);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
  }

  // Subtitle / Genre Tagline
  if (options.subtitle) {
    ctx.fillStyle = options.accentColor;
    ctx.font = 'italic 34px "Newsreader", serif';
    ctx.fillText(options.subtitle, width / 2, startY + totalTitleHeight + 50);
  }

  // Divider flourish
  const divY = height - 380;
  ctx.strokeStyle = options.accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 80, divY);
  ctx.lineTo(width / 2 - 20, divY);
  ctx.moveTo(width / 2 + 20, divY);
  ctx.lineTo(width / 2 + 80, divY);
  ctx.stroke();

  // Diamond center
  ctx.fillStyle = options.accentColor;
  ctx.beginPath();
  ctx.arc(width / 2, divY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Author Name
  ctx.fillStyle = options.textColor || '#ffffff';
  ctx.font = '600 42px "Plus Jakarta Sans", sans-serif';
  const authorName = options.author || 'Unknown Author';
  ctx.fillText(authorName.toUpperCase(), width / 2, height - 260);

  return canvas.toDataURL('image/jpeg', 0.94);
}
