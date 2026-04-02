import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  checkBackendHealth,
  runBackendDiagnostics,
  getDeploymentInstructions,
} from "../utils/backendHealthCheck";
export function BackendStatusIndicator() {
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);
  const checkHealth = async (silent = true) => {
    setChecking(true);
    const result = await checkBackendHealth(silent);
    setHealth(result);
    setChecking(false);
  };
  useEffect(() => {
    if (open && !health && !checking) {
      checkHealth(true);
    }
  }, [open, health, checking]);
  const handleRunDiagnostics = () => {
    runBackendDiagnostics();
  };
  const handleShowInstructions = () => {
    console.log(getDeploymentInstructions());
    alert("Deployment instructions logged to console (F12)");
  };
  const getStatusColor = () => {
    if (!health) return "bg-gray-500";
    if (health.status === "healthy") return "bg-green-500";
    if (health.status === "timeout") return "bg-yellow-500";
    return "bg-red-500";
  };
  const getStatusIcon = () => {
    if (checking) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!health) return <Activity className="h-4 w-4" />;
    if (health.status === "healthy") return <CheckCircle className="h-4 w-4" />;
    if (health.status === "timeout") return <AlertCircle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };
  const getStatusText = () => {
    if (checking) return "Checking...";
    if (!health) return "Unknown";
    if (health.status === "healthy") return "Online";
    if (health.status === "timeout") return "Timeout";
    return "Offline";
  };

  // Only show indicator in development mode or if backend is having issues
  const isDevelopment = import.meta.env.DEV;
  const isHealthy = health?.status === "healthy";

  // In production, only show if there's an actual error (not timeout)
  if (!isDevelopment && (isHealthy || health?.status === "timeout")) {
    return null;
  }

  // In development, hide if healthy
  if (isDevelopment && isHealthy) {
    return null;
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild={true}>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-white text-sm font-medium transition-colors hover:opacity-90 ${getStatusColor()}`}
        >
          {getStatusIcon()}
          <span>
            {"Backend: "}
            {getStatusText()}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Backend Status</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={checkHealth}
              disabled={checking}
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${checking ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="font-medium">
                {health?.message || getStatusText()}
              </div>
              {health?.responseTime && (
                <div className="text-xs text-muted-foreground">
                  {"Response time: "}
                  {health.responseTime}ms
                </div>
              )}
            </div>
          </div>
          {health?.status === "timeout" && (
            <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-yellow-700 dark:text-yellow-400">
                    Backend Timeout
                  </div>
                  <div className="text-yellow-600 dark:text-yellow-300">
                    {health.message}
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    The app will continue to work using local storage. Backend
                    features may be unavailable.
                  </div>
                </div>
              </div>
            </div>
          )}
          {health?.status === "unhealthy" && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-red-700 dark:text-red-400">
                    Backend Error
                  </div>
                  <div className="text-red-600 dark:text-red-300">
                    {health.message}
                  </div>
                </div>
              </div>
            </div>
          )}
          {health?.status === "healthy" && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1 text-sm text-green-700 dark:text-green-300">
                  Backend is online and responding correctly. All features are
                  available.
                </div>
              </div>
            </div>
          )}
          {health?.status !== "healthy" && (
            <div className="space-y-2 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="font-medium text-sm text-blue-700 dark:text-blue-300">
                {health?.status === "timeout"
                  ? "Backend May Need Attention"
                  : "Backend Action Required"}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <p>The backend API is not responding as expected:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Ensure the Express backend is running</li>
                  <li>Verify `VITE_API_URL` points to the correct API base URL</li>
                  <li>Check backend logs and redeploy if needed</li>
                </ol>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={handleShowInstructions}
              >
                Show Full Instructions
              </Button>
            </div>
          )}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleRunDiagnostics}
            >
              Run Diagnostics
            </Button>
          </div>
          {health?.timestamp && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              {"Last checked: "}
              {new Date(health.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
