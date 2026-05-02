import React, { useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

/**
 * SUPER NUCLEAR ADMIN COMPONENT
 * Shows EVERYTHING in the database before wiping
 */
export function AdminSuperNuclear() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const handleSuperNuclear = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    console.log("🚨🚨🚨 [SUPER NUCLEAR] Starting ultra-aggressive wipe...");
    try {
      // Step 1: Call nuclear reset FIRST
      console.log("🔥 [SUPER NUCLEAR] Calling nuclear reset...");
      const resetResponse = await fetch(
        `${API_BASE_URL}/admin/nuclear-reset`,
        {
          ...defaultOptions,
          method: "POST",
        },
      );
      const resetData = await resetResponse.json();
      console.log("🔥 [SUPER NUCLEAR] Nuclear reset response:", resetData);
      const summaryData = {
        resetDeleted: resetData.deletedUsers || 0,
        resetKeys: resetData.totalKeysDeleted || 0,
        deletedInvitations: resetData.deletedInvitations || 0,
        remainingFounders: resetData.remainingFounders || [],
        debug: resetData.debug,
      };
      setResult(summaryData);

      // Clear localStorage
      console.log("🧹 [SUPER NUCLEAR] Clearing localStorage...");
      const keysToKeep = ["startupverse_ui_mode", "theme"];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      alert(
        `🚨 SUPER NUCLEAR COMPLETE!\n\n` +
          `DELETED:\n` +
          `  • ${summaryData.resetDeleted} users\n` +
          `  • ${summaryData.deletedInvitations} invitations\n` +
          `  • ${summaryData.resetKeys} total keys\n\n` +
          `REMAINING:\n` +
          `  • ${summaryData.remainingFounders.length} founders\n` +
          `${summaryData.remainingFounders.map((f) => `    - ${f.name} (${f.email})`).join("\n")}\n\n` +
          `✅ Database wiped!\n` +
          `✅ localStorage cleared!\n\n` +
          `Page will reload in 2 seconds...`,
      );
      setTimeout(() => {
        console.log("🔄 [SUPER NUCLEAR] Reloading page...");
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("❌ [SUPER NUCLEAR] Error:", error);
      alert(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-purple-900 border-2 border-purple-500 rounded-lg p-4 shadow-2xl max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">🚨</span>
          <div>
            <h3 className="text-white font-bold text-sm">SUPER NUCLEAR</h3>
            <p className="text-purple-200 text-xs">With Before/After Check</p>
          </div>
        </div>
        <button
          onClick={handleSuperNuclear}
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg font-bold text-white transition-all text-sm ${showConfirm ? "bg-purple-600 hover:bg-purple-700 animate-pulse" : "bg-purple-800 hover:bg-purple-700"}`}
        >
          {loading ? (
            <>⏳ Nuking...</>
          ) : showConfirm ? (
            <>⚠️ CLICK AGAIN TO CONFIRM</>
          ) : (
            <>🚨 SUPER NUCLEAR WIPE</>
          )}
        </button>
        {showConfirm && !loading && (
          <button
            onClick={() => setShowConfirm(false)}
            className="w-full mt-2 px-4 py-2 rounded-lg text-sm text-white bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
        {result && (
          <div className="mt-3 p-3 bg-black/50 rounded text-xs text-white max-h-64 overflow-auto">
            <div className="mb-2">
              <div className="font-bold text-purple-300">DELETED:</div>
              <div>
                {result.resetDeleted}
                {" users"}
              </div>
              <div>
                {result.resetKeys}
                {" keys"}
              </div>
              <div>
                {result.deletedInvitations}
                {" invitations"}
              </div>
            </div>
            <div>
              <div className="font-bold text-purple-300">REMAINING:</div>
              <div>
                {result.remainingFounders.length}
                {" founders"}
              </div>
              <div className="text-xs text-gray-400">
                {result.remainingFounders
                  .map((f) => `${f.name} (${f.email})`)
                  .join(", ")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
