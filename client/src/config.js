// Central config — edit VITE_API_URL in your .env file
// Local dev:  VITE_API_URL=http://localhost:5000
// Production: VITE_API_URL=https://your-app.onrender.com

export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = `${BACKEND_URL}/api`;
