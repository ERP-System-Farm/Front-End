/**
 * Cloudinary Helper Utilities
 * Parses and returns absolute Cloudinary URLs.
 */

export const getCloudinaryUrl = (path) => {
  if (!path) return '';
  // If already absolute URL, return as is
  if (path.startsWith('http')) return path;

  // If VITE_CLOUDINARY_URL is provided, build the absolute URL
  const cloudinaryBase = import.meta.env.VITE_CLOUDINARY_URL;
  if (cloudinaryBase) {
    return `${cloudinaryBase.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  // Fallback to Backend Base URL
  const backendBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return `${backendBase.replace(/\/api\/?$/, '')}/${path.replace(/^\//, '')}`;
};
