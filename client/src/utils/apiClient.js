/**
 * API client with backend detection and graceful fallback.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  isBackendOnline = null;
  lastHealthCheck = 0;
  healthCheckInterval = 30000;
  config = {
    enableFallback: true,
    fallbackMode: "localStorage",
    onBackendOffline: () => {},
    onBackendOnline: () => {},
  };

  constructor(config) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.checkBackendHealth().catch(() => {});
  }

  async checkBackendHealth() {
    const now = Date.now();

    if (
      this.isBackendOnline !== null &&
      now - this.lastHealthCheck < this.healthCheckInterval
    ) {
      return this.isBackendOnline;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const wasOffline = this.isBackendOnline === false;
      this.isBackendOnline = response.ok;
      this.lastHealthCheck = now;

      if (this.isBackendOnline && wasOffline) {
        this.config.onBackendOnline?.();
      } else if (!this.isBackendOnline && !wasOffline) {
        this.config.onBackendOffline?.();
      }

      return this.isBackendOnline;
    } catch {
      const wasOnline = this.isBackendOnline === true;
      this.isBackendOnline = false;
      this.lastHealthCheck = now;

      if (wasOnline) {
        this.config.onBackendOffline?.();
      }

      return false;
    }
  }

  async request(endpoint, options = {}) {
    const isHealthy = await this.checkBackendHealth();

    if (!isHealthy && !this.config.enableFallback) {
      return {
        data: null,
        error: "Backend server is offline. Please deploy the backend function.",
        usingFallback: false,
      };
    }

    if (isHealthy) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        return { data, error: null, usingFallback: false };
      } catch (error) {
        this.isBackendOnline = false;
        if (this.config.enableFallback) {
          return this.handleFallback(endpoint, options);
        }
        return { data: null, error: error.message, usingFallback: false };
      }
    }

    if (this.config.enableFallback) {
      return this.handleFallback(endpoint, options);
    }

    return {
      data: null,
      error: "Backend server is offline",
      usingFallback: false,
    };
  }

  handleFallback(endpoint, options) {
    if (this.config.fallbackMode === "none") {
      return {
        data: null,
        error: "Backend offline and no fallback configured",
        usingFallback: false,
      };
    }

    try {
      const method = options.method || "GET";
      const body = options.body ? JSON.parse(options.body) : null;

      if (method === "GET") {
        const data = this.getFallbackData(endpoint);
        return { data, error: null, usingFallback: true };
      }

      if (method === "POST" || method === "PUT" || method === "PATCH") {
        const data = this.setFallbackData(endpoint, body);
        return { data, error: null, usingFallback: true };
      }

      if (method === "DELETE") {
        this.deleteFallbackData(endpoint);
        return { data: { success: true }, error: null, usingFallback: true };
      }

      return {
        data: null,
        error: "Unsupported method in fallback mode",
        usingFallback: true,
      };
    } catch (error) {
      console.error("Fallback error:", error);
      return { data: null, error: error.message, usingFallback: true };
    }
  }

  getFallbackData(endpoint) {
    if (this.config.fallbackMode === "localStorage") {
      const key = this.endpointToKey(endpoint);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  }

  setFallbackData(endpoint, data) {
    if (this.config.fallbackMode === "localStorage") {
      const key = this.endpointToKey(endpoint);
      localStorage.setItem(key, JSON.stringify(data));
      return { success: true, ...data };
    }
    return { success: true, ...data };
  }

  deleteFallbackData(endpoint) {
    if (this.config.fallbackMode === "localStorage") {
      const key = this.endpointToKey(endpoint);
      localStorage.removeItem(key);
    }
  }

  endpointToKey(endpoint) {
    return `fallback:${endpoint.replace(/\//g, ":")}`;
  }

  getStatus() {
    return {
      online: this.isBackendOnline,
      lastCheck: this.lastHealthCheck,
    };
  }

  async forceHealthCheck() {
    this.lastHealthCheck = 0;
    return this.checkBackendHealth();
  }
}

export const apiClient = new ApiClient({
  enableFallback: true,
  fallbackMode: "localStorage",
});

export async function isBackendOnline() {
  return apiClient.checkBackendHealth();
}

export async function forceBackendHealthCheck() {
  return apiClient.forceHealthCheck();
}

export function getBackendStatus() {
  return apiClient.getStatus();
}
