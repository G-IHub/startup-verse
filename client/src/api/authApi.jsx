import { getAccessToken } from "../app/session";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(payloadData),
    });

    const payload = await response.json();
    const result = payload?.data || {};

    if (!response.ok) {
      console.error("❌ [AuthAPI] Signup failed:", payload?.message);
      throw new Error(payload?.message || "Signup failed");
    }

    console.log("✅ [AuthAPI] Signup successful:", result.user?.email);
    return { user: result.user, token: result.token || "" };
  },

  /**
   * Sign in an existing user
   */
  signin: async (data) => {
    console.log("🔐 [AuthAPI] Signing in:", data.email);

    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(data),
    });

    const payload = await response.json();
    const result = payload?.data || {};

    if (!response.ok) {
      console.error("❌ [AuthAPI] Signin failed:", payload?.message);
      throw new Error(payload?.message || "Signin failed");
    }

    console.log("✅ [AuthAPI] Signin successful:", result.user?.email);
    return { user: result.user, token: result.token || "" };
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, updates) => {
    console.log("🔄 [AuthAPI] Updating profile:", userId);

    const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
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
};
