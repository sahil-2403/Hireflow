import { AUTH_STORAGE_KEY } from "./auth.constants";

const getStoredSession = () => {
  try {
    const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const session = JSON.parse(storedValue);

    if (!session?.user || !session?.accessToken || !session?.refreshToken) {
      localStorage.removeItem(AUTH_STORAGE_KEY);

      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);

    return null;
  }
};

const storeSession = (session) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

const removeStoredSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export { getStoredSession, storeSession, removeStoredSession };
