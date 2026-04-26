const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;

const VISION_PATTERNS = [
  /gpt-4o/i,
  /gpt-4.*turbo/i,
  /gpt-4.*vision/i,
  /llava/i,
  /moondream/i,
  /qwen.*vl/i,
  /qwen35/i,
  /minicpm-v/i,
];

export function validateImage(file: File): void {
  if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
    throw new Error(
      `Unsupported file format "${file.type}". Accepted formats: JPEG, PNG, WebP.`,
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`,
    );
  }
}

export async function resizeAndCompressFromUrl(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Could not get canvas context. Try a smaller image.")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Image compression failed. Try a smaller image.")); return; }
          resolve(blob);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for processing."));
    img.src = url;
  });
}

export async function resizeAndCompress(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context. Try a smaller image."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression failed. Try a smaller image."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for processing."));
    };

    img.src = objectUrl;
  });
}

export function encodeToBase64DataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to encode image to base64."));
    reader.readAsDataURL(blob);
  });
}

export function detectVisionCapability(modelId: string): boolean {
  return VISION_PATTERNS.some((pattern) => pattern.test(modelId));
}
