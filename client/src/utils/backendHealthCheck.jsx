/**
 * Backend Health Check Utility
 * Monitors Express API availability and response time.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const HEALTH_TIMEOUT = 10000; // 10 seconds

/**
 * Check backend health with timeout
 */
export async function checkBackendHealth(silent = true) {
  const startTime = Date.now();

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

    if (!silent) {
      console.log("🏥 [Health Check] Starting backend health check...");
    }

    // Try to hit a simple endpoint
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();

      if (!silent) {
        console.log(`✅ [Health Check] Backend healthy (${responseTime}ms)`);
      }

      return {
        status: "healthy",
        message: `Backend operational (${responseTime}ms)`,
        timestamp: Date.now(),
        responseTime,
        details: data,
      };
    } else {
      if (!silent) {
        console.error(`❌ [Health Check] Backend returned ${response.status}`);
      }

      return {
        status: "unhealthy",
        message: `Backend error: ${response.status}`,
        timestamp: Date.now(),
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error.name === "AbortError") {
      if (!silent) {
        console.warn(
          `⚠️ [Health Check] Backend timeout (>${HEALTH_TIMEOUT}ms)`,
        );
      }

      return {
        status: "timeout",
        message: `Backend timeout (>${HEALTH_TIMEOUT / 1000}s) - function may not be deployed`,
        timestamp: Date.now(),
        responseTime,
      };
    }

    if (!silent) {
      console.error("❌ [Health Check] Backend unreachable:", error.message);
    }

    return {
      status: "unhealthy",
      message: `Backend unreachable: ${error.message}`,
      timestamp: Date.now(),
      responseTime,
    };
  }
}

/**
 * Run comprehensive diagnostics
 */
export async function runBackendDiagnostics() {
  console.log("🔍 [Diagnostics] Running comprehensive backend diagnostics...");

  // 1. Health check
  const health = await checkBackendHealth(false);

  // 2. Test critical endpoints
  const endpoints = {};

  const testEndpoints = ["/health", "/ping"];

  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      endpoints[endpoint] = response.ok;
      console.log(
        `${response.ok ? "✅" : "❌"} [Diagnostics] ${endpoint}: ${response.status}`,
      );
    } catch (error) {
      endpoints[endpoint] = false;
      console.log(`❌ [Diagnostics] ${endpoint}: Failed`);
    }
  }

  // 3. Check deployment
  const isDeployed =
    health.status === "healthy" || Object.values(endpoints).some((v) => v);

  console.log(`📊 [Diagnostics] Summary:`, {
    health: health.status,
    deployment: isDeployed ? "deployed" : "not deployed",
    workingEndpoints: Object.entries(endpoints)
      .filter(([_, v]) => v)
      .map(([k]) => k),
  });

  return {
    health,
    endpoints,
    deployment: isDeployed,
  };
}

/**
 * Get deployment instructions
 */
export function getDeploymentInstructions() {
  return `
## Backend Not Deployed ⚠️

The backend API is not responding. This could mean:

1. **Backend not running yet** - Start or deploy the backend service.

2. **Cold start delay** - First request after deployment can take 10-30 seconds. Wait and refresh.

3. **Deployment error** - Check backend logs.

4. **Environment variables missing** - Ensure backend secrets are configured.

## Working in Offline Mode

While the backend is unavailable, StartupVerse will use localStorage for data persistence.
All features work normally, but data won't sync across devices.

## Need Help?

Check the deployment guide: /DEPLOYMENT_GUIDE.md
  `.trim();
}
