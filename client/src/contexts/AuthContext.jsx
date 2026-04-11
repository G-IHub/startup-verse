import React, { createContext, useContext, useState, useEffect } from "react";
import { setAdminFlag } from "../utils/adminHelpers";
import {
  clearAuthSession,
  ensureSessionMigration,
  getAccessToken,
  setAccessToken,
  setSessionUser,
} from "../app/session";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load auth session on mount
  useEffect(() => {
    try {
      const session = ensureSessionMigration();
      if (session?.user) {
        // Automatically set admin flag based on email
        const userWithAdmin = setAdminFlag(session.user);
        setUser(userWithAdmin);
      }
      setToken(getAccessToken());
    } catch (error) {
      console.error("Error loading auth session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = (nextUser) => {
    const normalized = nextUser ? setAdminFlag(nextUser) : null;
    setUser(normalized);
    setSessionUser(normalized);
  };

  const login = ({ user: nextUser, accessToken = "" }) => {
    setAccessToken(accessToken);
    setToken(accessToken || "");
    updateUser(nextUser);
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setToken("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: updateUser,
        token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
