//export const BASE_URL = "http://34.100.215.230:5000/api";
//export const BASE_URL =
  //process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";


export const BASE_URL = process.env.NODE_ENV === "production"
  ? "/api"
  : "http://localhost:5000/api";
//export const BASE_URL = "/api";  // <-- forcefully hardcoded
