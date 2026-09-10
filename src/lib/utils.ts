// Utility functions shared across the app

/**
 * Read a File object as a base64 string for transmission to the edge function.
 * The edge function decodes this and computes SHA-256 over the raw bytes.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Format a date string into a human-readable format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp into a full date-time string.
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate a hash to a display-friendly format: first 10 + ... + last 8 chars.
 */
export function truncateHash(hash: string): string {
  if (!hash || hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Copy text to clipboard with a fallback for older browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Format file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a UUID v4 for the certificate ID field.
 */
export function generateUUID(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Compute SHA-256 hash using the Web Crypto API
 */
export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates an uploaded certificate document for safe file types and size limits.
 * Allowed: PDF, PNG, JPG/JPEG up to 10 MB.
 */
export const ALLOWED_CERT_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
export const ALLOWED_CERT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
export const MAX_CERT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bin', '.js', '.mjs', '.ts', '.html', '.htm',
  '.svg', '.vbs', '.msi', '.ps1', '.php', '.py', '.rb', '.com', '.scr', '.pif',
  '.jar', '.apk', '.vbe', '.wsf', '.wsh'
];

export function validateCertificateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileNameLower = file.name.toLowerCase();

  // Double extension detection (e.g., cert.php.png, invoice.pdf.exe)
  const parts = fileNameLower.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length; i++) {
      const subExt = `.${parts[i]}`;
      if (DANGEROUS_EXTENSIONS.includes(subExt)) {
        return {
          valid: false,
          error: `Multiple file extensions containing dangerous executable/script pattern (${subExt}) are prohibited.`
        };
      }
    }
  }

  // Check dangerous extensions
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (fileNameLower.endsWith(ext)) {
      return {
        valid: false,
        error: `Executable or script files (${ext}) are prohibited for security reasons.`
      };
    }
  }

  // Check allowed extensions
  const hasValidExt = ALLOWED_CERT_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Invalid file format. Only PDF, PNG, or JPG/JPEG documents are accepted.'
    };
  }

  // Check MIME type if available
  if (file.type && !ALLOWED_CERT_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported MIME type (${file.type}). Please upload a valid PDF or image.`
    };
  }

  // Check file size (5MB max)
  if (file.size > MAX_CERT_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 5 MB maximum limit (selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'Selected file is empty (0 bytes). Please upload a valid document.'
    };
  }

  return { valid: true };
}

/**
 * Sanitize plain user inputs by trimming and removing potential script tags or control characters.
 */
export function sanitizeInput(input: string, maxLength = 255): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Escape HTML special characters to prevent stored/reflected XSS.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

