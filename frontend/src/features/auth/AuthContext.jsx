import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getCurrentUser, refreshSession } from "../../api/auth.api";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const isAuthenticated = Boolean(user);

  const restoreSession = useCallback(async () => {
    try {
      const result = await getCurrentUser();

      setUser(result.data);
    } catch {
      try {
        await refreshSession();

        const result = await getCurrentUser();

        setUser(result.data);
      } catch {
        setUser(null);
      }
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

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
