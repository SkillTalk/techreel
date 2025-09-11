



// Check if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Allow overriding via build-time env (process.env) or runtime env (window._env)
const RUNTIME = (typeof window !== 'undefined' && window._env) || {};
// CRA inlines process.env.REACT_APP_* at build time
// eslint-disable-next-line no-undef
const BUILD_REACT_APP_API_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ? process.env.REACT_APP_API_BASE : undefined;
// eslint-disable-next-line no-undef
const BUILD_REACT_APP_SOCKET_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SOCKET_BASE) ? process.env.REACT_APP_SOCKET_BASE : undefined;

const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';

export const BASE_URL = isDevelopment
  ? (RUNTIME.REACT_APP_API_BASE || BUILD_REACT_APP_API_BASE || "http://localhost:5001/api")
  : (
      RUNTIME.REACT_APP_API_BASE ||
      BUILD_REACT_APP_API_BASE ||
      // Default backend host for production (goes straight to API tunnel)
      "https://api.skilltalk.in/api"
    );

export const SOCKET_URL = isDevelopment
  ? (RUNTIME.REACT_APP_SOCKET_BASE || BUILD_REACT_APP_SOCKET_BASE || "http://localhost:5001")
  : (
      RUNTIME.REACT_APP_SOCKET_BASE ||
      BUILD_REACT_APP_SOCKET_BASE ||
      // Default websocket origin for production (same host as API)
      "https://api.skilltalk.in"
    );

