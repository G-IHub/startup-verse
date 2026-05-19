import { useEffect, useState } from "react";
import { nuclearWipeAndRestart } from "../utils/nuclearWipe";
import { Loader2 } from "lucide-react";

const SESSION_DONE_KEY = "sv_one_time_nuclear_done";

/**
 * 🔥 ONE-TIME NUCLEAR WIPE COMPONENT
 * Runs once per browser tab session (marker kept in session-scoped storage while wipe skips clearing it).
 */
export function OneTimeNuclearWipe() {
  const [status, setStatus] = useState("Starting nuclear wipe...");
  const [progress, setProgress] = useState(0);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_DONE_KEY) === "1") {
      console.log(
        "✅ Nuclear wipe already completed in this tab, hiding component...",
      );
      setShouldRender(false);
      return;
    }

    const executeWipe = async () => {
      console.log("🔥🔥🔥 ONE-TIME NUCLEAR WIPE INITIATED 🔥🔥🔥");

      sessionStorage.setItem(SESSION_DONE_KEY, "1");

      setProgress(10);
      setStatus("Clearing database...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(30);
      setStatus("Clearing persistent browser storage...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(50);
      setStatus("Preserving session marker...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(70);
      setStatus("Clearing cookies and cache...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(90);
      setStatus("Finalizing...");

      await nuclearWipeAndRestart({ preserveSessionStorage: true });
      setProgress(100);
      setStatus("Complete! Redirecting...");
    };

    executeWipe();
  }, []);

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
          <p>• Clearing persistent browser storage</p>
          <p>• Clearing cookies and caches</p>
          <p>• Logging out all users</p>
        </div>
      </div>
    </div>
  );
}
