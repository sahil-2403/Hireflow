import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getCurrentUser } from "../../api/auth.api";

import refreshSessionOnce from "./refreshSessionOnce";

const AuthContext = createContext(null);

const hasAlreadyAttemptedSessionRefresh = (error) => {
  const requestUrl = error?.config?.url || "";

  return Boolean(
    error?.config?._authRetry || requestUrl.includes("/auth/refresh-token"),
  );
};

const getSessionUser = async () => {
  try {
    const result = await getCurrentUser();

    return result.data;
  } catch (error) {
    if (hasAlreadyAttemptedSessionRefresh(error)) {
      return null;
    }

    try {
      await refreshSessionOnce();

      const result = await getCurrentUser();

      return result.data;
    } catch {
      return null;
    }
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    let shouldIgnore = false;

    const initializeSession = async () => {
      const sessionUser = await getSessionUser();

      if (shouldIgnore) {
        return;
      }

      setUser(sessionUser);
      setIsInitializing(false);
    };

    initializeSession();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  const restoreSession = useCallback(async () => {
    setIsInitializing(true);

    const sessionUser = await getSessionUser();

    setUser(sessionUser);
    setIsInitializing(false);

    return sessionUser;
  }, []);

  const signIn = useCallback((userData) => {
    setUser(userData);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((currentUser) => ({
      ...currentUser,
      ...userData,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isInitializing,
      signIn,
      signOut,
      updateUser,
      restoreSession,
    }),
    [
      user,
      isAuthenticated,
      isInitializing,
      signIn,
      signOut,
      updateUser,
      restoreSession,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
