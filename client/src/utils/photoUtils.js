import { BACKEND_URL } from '../config';

/**
 * Resolves a photo URL. 
 * If it's a full URL (starts with http), it's returned as-is.
 * If it's just a filename, it's appended to the backend uploads path.
 */
export const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // Handle paths that might already start with /uploads
  if (path.startsWith('/uploads')) return `${BACKEND_URL}${path}`;
  
  return `${BACKEND_URL}/uploads/${path}`;
};
