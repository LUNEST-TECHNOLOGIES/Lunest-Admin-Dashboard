/**
 * Utility for resolving and normalizing image URLs across the Admin Dashboard.
 * Fixes ERR_CONNECTION_TIMED_OUT issues by dynamically replacing outdated 
 * hostnames/IPs in stored URLs with the current backend BASE_URL.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
const BASE_URL = API_URL.replace(/\/v1\/?$/, ''); // Remove /v1 for static uploads access
const CLOUDFRONT_URL = (import.meta.env.VITE_CLOUDFRONT_URL || 'https://d1eoci8rrogdfp.cloudfront.net').replace(/\/$/, '');

const warnUnresolvableImage = (img) => {
  if (import.meta.env.DEV) console.warn('[imageUtils] Unable to resolve image', img);
};

const cloudFrontUrlForKey = (key) => {
  const normalizedKey = String(key || '').replace(/^\/+/, '').replace(/^uploads\//, '');
  return normalizedKey ? `${CLOUDFRONT_URL}/${normalizedKey}` : null;
};

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
    const candidate = img.url || img.uri || img.path || img.src || img.location || img.Location || img.key || img.Key || img.file || img.filename;
    if (candidate) return resolveImageUrl(candidate);
    warnUnresolvableImage(img);
    return null;
  }

  // At this point img should be a string
  if (typeof img !== 'string') {
    warnUnresolvableImage(img);
    return null;
  }
  const value = img.trim();
  if (!value) return null;

  // Skip local file URIs (cannot be loaded from browser)
  if (value.startsWith('file://')) return null;

  // Skip Android content:// URIs (cannot be loaded from browser)
  if (value.startsWith('content://')) return null;

  // Allow base64 data URIs directly
  if (value.startsWith('data:image/')) return value;

  // If it's an absolute HTTP URL, check if it contains /uploads/
  if (/^https?:\/\//i.test(value)) {
    // If it points to our uploads directory, force it to use our current BASE_URL
    // This fixes issues where the DB has an old IP address (e.g. from local development)
    if (value.includes('/uploads/')) {
      const pathAfterUploads = value.split('/uploads/')[1];
      const cleanBase = BASE_URL.replace(/\/$/, '');
      return `${cleanBase}/uploads/${pathAfterUploads}`;
    }
    try {
      const parsed = new URL(value);
      const isS3Url = /\.s3[.-]/i.test(parsed.hostname) || /amazonaws\.com$/i.test(parsed.hostname);
      const isCloudFrontUrl = /\.cloudfront\.net$/i.test(parsed.hostname);
      if (isS3Url || (isCloudFrontUrl && parsed.origin !== CLOUDFRONT_URL)) {
        return cloudFrontUrlForKey(decodeURIComponent(parsed.pathname));
      }
    } catch {
      warnUnresolvableImage(img);
      return null;
    }
    return value;
  }

  if (/^(?:uploads\/)?(?:properties|listings|images|avatars|host-applications)\//i.test(value)) {
    return cloudFrontUrlForKey(value);
  }

  // Otherwise treat as relative path and prepend BASE_URL
  const cleanBase = BASE_URL.replace(/\/$/, '');
  return `${cleanBase}${value.startsWith('/') ? '' : '/'}${value}`;
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
