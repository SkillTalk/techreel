



// Check if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Allow overriding via global env injected at build/runtime (Cloudflare Pages env vars → window._env)
const ENV = (typeof window !== 'undefined' && window._env) || {};

export const BASE_URL = isDevelopment
  ? (ENV.REACT_APP_API_BASE || "http://localhost:5001/api")
  : (ENV.REACT_APP_API_BASE || "https://www.skilltalk.in/api");

export const SOCKET_URL = isDevelopment
  ? (ENV.REACT_APP_SOCKET_BASE || "http://localhost:5001")
  : (ENV.REACT_APP_SOCKET_BASE || "https://www.skilltalk.in");

