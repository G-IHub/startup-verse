/**
 * Simple Backend Client
 * Provides basic HTTP methods for API calls
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export async function get(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend GET error (${endpoint}):`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Backend GET exception (${endpoint}):`, error);
    return { success: false, error: error.message };
  }
}

export async function post(endpoint, body) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend POST error (${endpoint}):`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Backend POST exception (${endpoint}):`, error);
    return { success: false, error: error.message };
  }
}

export async function put(endpoint, body) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend PUT error (${endpoint}):`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Backend PUT exception (${endpoint}):`, error);
    return { success: false, error: error.message };
  }
}

export async function del(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend DELETE error (${endpoint}):`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Backend DELETE exception (${endpoint}):`, error);
    return { success: false, error: error.message };
  }
}
