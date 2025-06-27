/*
export const BASE_URL = process.env.NODE_ENV === "production"
  ? "/api"
  : "http://localhost:5000/api";


export const SOCKET_URL = process.env.NODE_ENV === "production"
  ? "/"
  : "http://localhost:5000";
*/



export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.skilltalk.in/api"
    : "http://localhost:5000/api";

export const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.skilltalk.in"
    : "http://localhost:5000";

