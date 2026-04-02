import { useEffect, useState } from "react";
import { nuclearWipeAndRestart } from "../utils/nuclearWipe";
import { Loader2 } from "lucide-react";

/**
 * 🔥 ONE-TIME NUCLEAR WIPE COMPONENT
 * This component will execute once and wipe everything
 * After execution, remove this component from App.tsx
 */
export function OneTimeNuclearWipe() {
  const [status, setStatus] = useState("Starting nuclear wipe...");
  const [progress, setProgress] = useState(0);
  const [shouldRender, setShouldRender] = useState(true);
  useEffect(() => {
    // Check if wipe has already been executed using a persistent marker
    // We check localStorage BEFORE clearing it
    const wipeCompleted = localStorage.getItem("nuclear_wipe_in_progress");
    if (wipeCompleted === "done") {
      console.log("✅ Nuclear wipe already completed, hiding component...");
      setShouldRender(false);
      return;
    }
    const executeWipe = async () => {
      console.log("🔥🔥🔥 ONE-TIME NUCLEAR WIPE INITIATED 🔥🔥🔥");

      // Mark as in progress
      localStorage.setItem("nuclear_wipe_in_progress", "started");

      // Show progress
      setProgress(10);
      setStatus("Clearing database...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(30);
      setStatus("Clearing localStorage...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(50);
      setStatus("Clearing sessionStorage...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(70);
      setStatus("Clearing cookies and cache...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(90);
      setStatus("Finalizing...");

      // Mark as done BEFORE clearing
      localStorage.setItem("nuclear_wipe_in_progress", "done");

      // Execute the actual nuclear wipe
      await nuclearWipeAndRestart();
      setProgress(100);
      setStatus("Complete! Redirecting...");
    };
    executeWipe();
  }, []); // Run once on mount

  // Don't render if already completed
  if (!shouldRender) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-8">
        <div className="text-8xl animate-pulse">🔥</div>
        <h1 className="text-3xl font-bold text-red-500">MEGA NUCLEAR WIPE</h1>
        <p className="text-white text-lg">{status}</p>
        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
          <div
            className="bg-red-600 h-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
        <p className="text-gray-400 text-sm">{progress}%</p>
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Clearing all data...</span>
        </div>
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-800">
          <p>• Deleting all database records</p>
          <p>• Clearing all localStorage</p>
          <p>• Clearing all sessionStorage</p>
          <p>• Deleting all cookies</p>
          <p>• Clearing all caches</p>
          <p>• Logging out all users</p>
        </div>
      </div>
    </div>
  );
}
