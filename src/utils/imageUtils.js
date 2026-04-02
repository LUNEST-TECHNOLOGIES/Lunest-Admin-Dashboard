/**
 * Utility for resolving and normalizing image URLs across the Admin Dashboard.
 * Fixes ERR_CONNECTION_TIMED_OUT issues by dynamically replacing outdated 
 * hostnames/IPs in stored URLs with the current backend BASE_URL.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
const BASE_URL = API_URL.replace(/\/v1\/?$/, ''); // Remove /v1 for static uploads access

/**
 * Resolves an image path or URL to a valid, reachable absolute URL.
 * 
 * @param {string|object} img - The image path, URL, or object containing image info
 * @returns {string|null} - The resolved absolute URL or null if invalid
 */
export const resolveImageUrl = (img) => {
  if (!img) return null;

  // If image is an object, try common fields recursively
  if (typeof img === 'object') {
    const candidate = img.url || img.uri || img.path || img.src || img.file || img.filename || img.name;
    if (candidate) return resolveImageUrl(candidate);
    return null;
  }

  // At this point img should be a string
  if (typeof img !== 'string') return null;

  // Skip local file URIs (cannot be loaded from browser)
  if (img.startsWith('file://')) return null;

  // Skip Android content:// URIs (cannot be loaded from browser)
  if (img.startsWith('content://')) return null;

  // Allow base64 data URIs directly
  if (img.startsWith('data:image/')) return img;

  // If it's an absolute HTTP URL, check if it contains /uploads/
  if (/^https?:\/\//i.test(img)) {
    // If it points to our uploads directory, force it to use our current BASE_URL
    // This fixes issues where the DB has an old IP address (e.g. from local development)
    if (img.includes('/uploads/')) {
      const pathAfterUploads = img.split('/uploads/')[1];
      const cleanBase = BASE_URL.replace(/\/$/, '');
      return `${cleanBase}/uploads/${pathAfterUploads}`;
    }
    return img;
  }

  // Otherwise treat as relative path and prepend BASE_URL
  const cleanBase = BASE_URL.replace(/\/$/, '');
  return `${cleanBase}${img.startsWith('/') ? '' : '/'}${img}`;
};

/**
 * Normalizes various image/array formats (strings, JSON strings, arrays).
 * 
 * @param {any} data - The data to normalize into an array
 * @returns {Array} - A normalized array of items
 */
export const normalizeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  
  // Handle stringified JSON array or comma-separated string
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      // Comma-separated string
      if (data.includes(',')) {
        return data.split(',').map(s => s.trim()).filter(Boolean);
      }
      // Single path string
      if (data.trim().length > 0) return [data.trim()];
      return [];
    }
  }
  
  // Single object/value
  return [data];
};
