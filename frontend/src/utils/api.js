



// Check if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const BASE_URL = isDevelopment
  ? "http://localhost:5001/api"
  : "https://www.skilltalk.in/api";

export const SOCKET_URL = isDevelopment
  ? "http://localhost:5001"
  : "https://www.skilltalk.in";

