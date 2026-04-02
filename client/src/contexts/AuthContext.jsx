import React, { createContext, useContext, useState, useEffect } from "react";
import { setAdminFlag } from "../utils/adminHelpers";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("startupverse_user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // Automatically set admin flag based on email
        const userWithAdmin = setAdminFlag(parsedUser);
        setUser(userWithAdmin);
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("startupverse_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("startupverse_user");
    }
  }, [user]);
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
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
