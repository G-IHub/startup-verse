import React, { useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { getAccessToken } from "../app/session";

/**
 * ADMIN NUCLEAR RESET COMPONENT
 * ⚠️ DANGER: This will delete ALL users except founders
 * Use this to clean up testing data and start fresh
 */
export function AdminNuclearReset() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    setResult(null);
    console.log("🔥🔥🔥 [NUCLEAR RESET] Starting from frontend...");
    console.log(
      "🔥 [NUCLEAR RESET] Endpoint:",
      `${API_BASE_URL}/admin/nuclear-reset`,
    );
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/nuclear-reset`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log("🔥 [NUCLEAR RESET] Response status:", response.status);
      console.log(
        "🔥 [NUCLEAR RESET] Response headers:",
        Object.fromEntries(response.headers.entries()),
      );
      const data = await response.json();
      console.log("🔥 [NUCLEAR RESET] Response data:", data);
      if (data.success) {
        setResult(data);
        console.log("✅ [NUCLEAR RESET] Success!");
        console.log("   - Deleted users:", data.deletedUsers);
        console.log("   - Deleted invitations:", data.deletedInvitations);
        console.log("   - Total keys deleted:", data.totalKeysDeleted);
        console.log("   - Remaining founders:", data.remainingFounders);
        console.log("   - DEBUG INFO:", data.debug);
        alert(
          `✅ NUCLEAR RESET COMPLETE!\n\n` +
            `🗑️ Deleted ${data.deletedUsers} users\n` +
            `📧 Deleted ${data.deletedInvitations} invitations\n` +
            `🔑 Deleted ${data.totalKeysDeleted || 0} total keys\n\n` +
            `Remaining founders:\n${data.remainingFounders.map((f) => `  - ${f.name} (${f.email})`).join("\n")}\n\n` +
            `CHECK THE CONSOLE for detailed logs!\n\n` +
            `Page will reload in 3 seconds...`,
        );

        // Reload page after 3 seconds
        setTimeout(() => {
          console.log("🔄 [NUCLEAR RESET] Reloading page...");
          window.location.reload();
        }, 3000);
      } else {
        console.error("❌ [NUCLEAR RESET] Failed:", data.error);
        alert(`❌ Error: ${data.error}`);
        setResult({
          error: data.error,
        });
      }
    } catch (error) {
      console.error("❌ [NUCLEAR RESET] Exception:", error);
      alert(`❌ Error: ${error}`);
      setResult({
        error: String(error),
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-red-900 border-2 border-red-500 rounded-lg p-4 shadow-2xl max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">☢️</span>
          <div>
            <h3 className="text-white font-bold text-lg">ADMIN CONTROLS</h3>
            <p className="text-red-200 text-xs">Development Only</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg font-bold text-white transition-all ${showConfirm ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-red-800 hover:bg-red-700"}`}
        >
          {loading ? (
            <>⏳ Resetting...</>
          ) : showConfirm ? (
            <>⚠️ CLICK AGAIN TO CONFIRM</>
          ) : (
            <>🔥 NUCLEAR RESET</>
          )}
        </button>
        <p className="text-red-200 text-xs mt-2 text-center">
          Deletes all team members, talent, and invitations
        </p>
        {showConfirm && !loading && (
          <button
            onClick={() => setShowConfirm(false)}
            className="w-full mt-2 px-4 py-2 rounded-lg text-sm text-white bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
        {result && (
          <div className="mt-3 p-3 bg-black/50 rounded text-xs text-white">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
