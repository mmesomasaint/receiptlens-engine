export const SUPPORTED_MIME_TYPES = {
  PDF: 'application/pdf',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  JPG: 'image/jpg',
} as const;

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'] as const;

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max per document
