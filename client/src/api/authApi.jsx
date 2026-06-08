import { API_BASE_URL } from "../config/apiBase.js";

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export const authApi = {
  /**
   * Sign up a new user
   */
  signup: async (data) => {
    const payloadData = {
      ...data,
      // Backend contract expects `name`; keep compatibility with UI `fullName`.
      name: data?.name || data?.fullName || "",
    };
    console.log("📝 [AuthAPI] Signing up:", {
      email: payloadData.email,
      role: payloadData.role,
    });

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify(payloadData),
    });

    const payload = await response.json();
    const result = payload?.data || {};

    if (!response.ok) {
      console.error("❌ [AuthAPI] Signup failed:", payload?.message);
      throw new Error(payload?.message || "Signup failed");
    }

    console.log("✅ [AuthAPI] Signup successful:", result.user?.email);
    // Token is now in HttpOnly cookie - no longer returned in response
    return { user: result.user };
  },

  /**
   * Sign in an existing user
   */
  signin: async (data) => {
    console.log("🔐 [AuthAPI] Signing in:", data.email);

    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify(data),
    });

    const payload = await response.json();
    const result = payload?.data || {};

    if (!response.ok) {
      console.error("❌ [AuthAPI] Signin failed:", payload?.message);
      throw new Error(payload?.message || "Signin failed");
    }

    console.log("✅ [AuthAPI] Signin successful:", result.user?.email);
    // Token is now in HttpOnly cookie - no longer returned in response
    return { user: result.user };
  },

  /**
   * Sign in or role-selected sign up with a Google Identity Services ID token.
   */
  google: async ({ credential, role } = {}) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      ...defaultOptions,
      method: "POST",
      body: JSON.stringify({
        credential,
        ...(role ? { role } : {}),
      }),
    });

    const payload = await response.json();
    const result = payload?.data || {};

    if (!response.ok) {
      throw new Error(payload?.message || "Google sign-in failed");
    }

    return { user: result.user };
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, updates) => {
    console.log("🔄 [AuthAPI] Updating profile:", userId);

    const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
      ...defaultOptions,
      method: "PUT",
      body: JSON.stringify(updates),
    });

    const payload = await response.json();
    const result = payload?.data || {};

    if (!response.ok) {
      console.error("❌ [AuthAPI] Update failed:", payload?.message);
      throw new Error(payload?.message || "Update failed");
    }

    console.log("✅ [AuthAPI] Profile updated:", result?.email);
    return result;
  },

  /**
   * Get current authenticated user (uses cookie)
   */
  me: async () => {
    console.log("👤 [AuthAPI] Getting current user");

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      ...defaultOptions,
      method: "GET",
    });

    const payload = await response.json();
    const result = payload?.data || {};

    if (!response.ok) {
      console.error("❌ [AuthAPI] Get me failed:", payload?.message);
      throw new Error(payload?.message || "Failed to get current user");
    }

    console.log("✅ [AuthAPI] Got current user:", result?.email);
    return result;
  },

  /**
   * Logout - clears HttpOnly cookie
   */
  logout: async () => {
    console.log("👋 [AuthAPI] Logging out");

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      ...defaultOptions,
      method: "POST",
    });

    const payload = await response.json();

    if (!response.ok) {
      console.error("❌ [AuthAPI] Logout failed:", payload?.message);
      throw new Error(payload?.message || "Logout failed");
    }

    console.log("✅ [AuthAPI] Logout successful");
    return payload?.data || { loggedOut: true };
  },
};
