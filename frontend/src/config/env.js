const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is missing. Add it to frontend/.env.local.",
  );
}

export { API_BASE_URL, GOOGLE_CLIENT_ID };
