import {
  createContext,
  useMemo,
  useState,
} from "react";

import {
  getStoredSession,
  removeStoredSession,
  storeSession,
} from "./auth.storage";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(
    () => getStoredSession()
  );

  const signIn = (sessionData) => {
    const newSession = {
      user: sessionData.user,
      accessToken:
        sessionData.accessToken,
      refreshToken:
        sessionData.refreshToken,
    };

    storeSession(newSession);
    setSession(newSession);
  };

  const updateSession = (sessionData) => {
    storeSession(sessionData);
    setSession(sessionData);
  };

  const signOut = () => {
    removeStoredSession();
    setSession(null);
  };

  const contextValue = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      accessToken:
        session?.accessToken ?? null,
      refreshToken:
        session?.refreshToken ?? null,

      isAuthenticated: Boolean(
        session?.user &&
          session?.accessToken
      ),

      signIn,
      updateSession,
      signOut,
    }),
    [session]
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

export {
  AuthContext,
  AuthProvider,
};