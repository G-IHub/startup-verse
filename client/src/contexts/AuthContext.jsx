import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi";
import { setAdminFlag } from "../utils/adminHelpers";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth session on mount - fetch from server using cookie
  useEffect(() => {
    const loadSession = async () => {
      try {
        const currentUser = await authApi.me();
        if (currentUser) {
          // Automatically set admin flag based on email
          const userWithAdmin = setAdminFlag(currentUser);
          setUser(userWithAdmin);
        }
      } catch (error) {
        // Not authenticated or session expired - user stays null
        console.log("No active session found");
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const updateUser = (nextUser) => {
    const normalized = nextUser ? setAdminFlag(nextUser) : null;
    setUser(normalized);
  };

  const login = ({ user: nextUser }) => {
    // Token is now stored in HttpOnly cookie by the server
    // Auth user is kept in memory / cookie session only
    updateUser(nextUser);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: updateUser,
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
