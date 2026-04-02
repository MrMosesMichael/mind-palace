/**
 * Client-side image compression using canvas.
 * Resizes and re-encodes images before upload to reduce bandwidth and storage.
 */

interface CompressOptions {
  /** Max width in pixels (default 2048) */
  maxWidth?: number;
  /** Max height in pixels (default 2048) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default 0.85) */
  quality?: number;
  /** Max file size in bytes — if original is under this, skip compression (default 2MB) */
  maxSizeBytes?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
};

/**
 * Compress an image file if it exceeds size or dimension thresholds.
 * Returns the original file if it's already small enough.
 */
export async function compressImage(
  file: File,
  options?: CompressOptions
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  // Skip non-image files
  if (!file.type.startsWith('image/')) return file;

  // Skip SVGs and GIFs (can't meaningfully compress via canvas)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  // If file is small enough, check dimensions before skipping
  const needsSizeReduction = file.size > opts.maxSizeBytes;

  // Load image to check dimensions
  const img = await loadImage(file);
  const needsResize = img.width > opts.maxWidth || img.height > opts.maxHeight;

  if (!needsSizeReduction && !needsResize) return file;

  // Calculate target dimensions maintaining aspect ratio
  let { width, height } = img;
  if (width > opts.maxWidth || height > opts.maxHeight) {
    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw to canvas and export
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b!),
      'image/jpeg',
      opts.quality
    );
  });

  // If somehow the compressed version is larger, return original
  if (blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}
