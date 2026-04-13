/**
 * Backend Health Check Utility
 * Tests if the backend API is reachable and responding.
 */

import { getAccessToken } from "../app/session";
import { API_BASE_URL } from "../config/apiBase.js";

/**
 * Check if backend is online.
 */
export async function checkBackendHealth(silent = false) {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      if (!silent) {
        console.log(`Backend is ONLINE (${responseTime}ms)`);
      }

      return {
        status: "healthy",
        message: "Backend is online and responding",
        responseTime,
        timestamp: Date.now(),
        version: data.version,
        online: true,
        latency: responseTime,
      };
    }

    const errorText = await response.text();
    if (!silent) {
      console.warn(
        `Backend responded with error: ${response.status} - ${errorText}`,
      );
    }

    return {
      status: "unhealthy",
      message: `HTTP ${response.status}: ${errorText}`,
      responseTime,
      timestamp: Date.now(),
      online: false,
      error: `HTTP ${response.status}: ${errorText}`,
      latency: responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    let errorMessage = "Network error";
    let helpfulMessage = "The backend may not be running yet.";
    let status = "unhealthy";

    if (error.name === "AbortError") {
      status = "timeout";
      errorMessage = "Request timeout (>10s)";
      helpfulMessage = "The backend did not respond in time.";
      if (!silent) {
        console.warn("Backend health check timeout (>10s).");
      }
    } else if (error.message === "Failed to fetch") {
      errorMessage = "Network error: Failed to fetch";
      helpfulMessage = "Cannot connect to backend. Verify API URL and server.";
      if (!silent) {
        console.warn("Backend health check failed: Failed to fetch.");
      }
    } else if (error.message?.includes("NetworkError")) {
      errorMessage = "Network error";
      helpfulMessage = "Network issue or CORS problem.";
      if (!silent) {
        console.warn("Backend health check network error:", error.message);
      }
    } else {
      errorMessage = error.message || "Unknown error";
      if (!silent) {
        console.warn("Backend health check failed:", error.message);
      }
    }

    return {
      status,
      message: `${errorMessage}\n\n${helpfulMessage}`,
      responseTime,
      timestamp: Date.now(),
      online: false,
      error: `${errorMessage}\n\n${helpfulMessage}`,
      latency: responseTime,
    };
  }
}

/**
 * Test backend with detailed diagnostics.
 */
export async function runBackendDiagnostics() {
  console.log("Running backend diagnostics...");
  console.log(`API URL: ${API_BASE_URL}`);
  console.log("");

  console.log("Test 1: Health endpoint");
  const healthResult = await checkBackendHealth();
  console.log(`Result: ${healthResult.status === "healthy" ? "PASS" : "FAIL"}`);
  if (healthResult.error) {
    console.log(`Error: ${healthResult.error}`);
  }
  if (healthResult.responseTime) {
    console.log(`Latency: ${healthResult.responseTime}ms`);
  }
  console.log("");

  console.log("Test 2: CORS preflight");
  try {
    const corsResponse = await fetch(`${API_BASE_URL}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: window.location.origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type,Authorization",
      },
    });
    console.log(`Result: ${corsResponse.ok ? "PASS" : "FAIL"}`);
    console.log(`CORS Status: ${corsResponse.status}`);
  } catch (error) {
    console.log("FAIL");
    console.log(`CORS Error: ${error.message}`);
  }
  console.log("");

  console.log("Backend diagnostics summary");
  if (healthResult.status === "healthy") {
    console.log("Backend is ONLINE and ready to use.");
    console.log(`Response time: ${healthResult.responseTime}ms`);
  } else {
    console.log("Backend is OFFLINE");
    console.log("Possible causes:");
    console.log("  1. API server is not running");
    console.log("  2. Deployment failed or crashed");
    console.log("  3. Network/firewall blocking requests");
    console.log("  4. Wrong VITE_API_URL or CORS configuration");
    console.log("To fix:");
    console.log("  1. Start or redeploy the Express backend");
    console.log("  2. Verify VITE_API_URL and /health endpoint");
    console.log("  3. Check backend logs for errors");
    console.log("  4. Confirm CORS allows the frontend origin");
  }
}

/**
 * Get backend troubleshooting instructions.
 */
export function getDeploymentInstructions() {
  return `
BACKEND TROUBLESHOOTING INSTRUCTIONS

The backend server is currently OFFLINE. To enable full functionality:

1. Start backend server (local or deployed)
2. Verify API health endpoint:
   Visit: ${API_BASE_URL}/health
   Should return: {"status":"ok"}
3. Confirm frontend configuration:
   - VITE_API_URL must point to backend API base URL
   - Browser origin must be allowed by backend CORS
4. Refresh this page

Need help?
Check backend server logs and deployment status.
`.trim();
}

/**
 * Run auth mapping migration for existing users.
 */
export async function runAuthMappingMigration(silent = false) {
  try {
    if (!silent) {
      console.log("Running auth mapping migration...");
    }

    const response = await fetch(`${API_BASE_URL}/migrate/auth-mappings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Migration failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!silent) {
      console.log(`Migration complete: ${result.fixed} auth mappings created`);
    }

    return { success: true, fixed: result.fixed };
  } catch (error) {
    if (!silent) {
      console.error("Migration failed:", error.message);
    }
    return { success: false, error: error.message };
  }
}
