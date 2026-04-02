const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const authApi = {
  /**
   * Sign up a new user
   */
  signup: async (data) => {
    console.log("📝 [AuthAPI] Signing up:", {
      email: data.email,
      role: data.role,
    });

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ [AuthAPI] Signup failed:", result.error);
      throw new Error(result.error || "Signup failed");
    }

    console.log("✅ [AuthAPI] Signup successful:", result.user.email);
    return result.user;
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
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ [AuthAPI] Signin failed:", result.error);
      throw new Error(result.error || "Signin failed");
    }

    console.log("✅ [AuthAPI] Signin successful:", result.user.email);
    return result.user;
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
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ [AuthAPI] Update failed:", result.error);
      throw new Error(result.error || "Update failed");
    }

    console.log("✅ [AuthAPI] Profile updated:", result.user.email);
    return result.user;
  },
};
