import React, { useState } from "react";

/**
 * MEGA NUCLEAR ADMIN COMPONENT
 * Deletes EVERYTHING including founders - complete database wipe
 */
export function AdminMegaNuclear() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const handleMegaNuclear = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    console.log("💀💀💀 [MEGA NUCLEAR] Starting complete database wipe...");
    try {
      // Call mega nuclear reset
      console.log("💀 [MEGA NUCLEAR] Calling mega nuclear reset...");
      const resetResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/admin/mega-nuclear-reset`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );
      const resetData = await resetResponse.json();
      console.log("💀 [MEGA NUCLEAR] Response:", resetData);
      setResult(resetData);

      // Clear ALL localStorage (keep nothing)
      console.log("🧹 [MEGA NUCLEAR] Clearing ALL localStorage...");
      localStorage.clear();
      alert(
        `💀 MEGA NUCLEAR COMPLETE!\n\n` +
          `DELETED:\n` +
          `  • ${resetData.deletedAuthUsers || 0} Supabase Auth users\n` +
          `  • ${resetData.totalKeysDeleted} total keys\n\n` +
          `VERIFICATION:\n` +
          `  • Remaining users: ${resetData.verification?.remainingUsers || 0}\n` +
          `  • Remaining invitations: ${resetData.verification?.remainingInvitations || 0}\n` +
          `  • Remaining auth mappings: ${resetData.verification?.remainingAuth || 0}\n` +
          `  • Database empty: ${resetData.verification?.isEmpty ? "YES ✅" : "NO ❌"}\n\n` +
          `✅ Database completely wiped!\n` +
          `✅ localStorage cleared!\n\n` +
          `Page will reload in 2 seconds...`,
      );
      setTimeout(() => {
        console.log("🔄 [MEGA NUCLEAR] Reloading page...");
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("❌ [MEGA NUCLEAR] Error:", error);
      alert(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };
  return (
    <div className="fixed bottom-32 right-4 z-50">
      <div className="bg-black border-2 border-red-600 rounded-lg p-4 shadow-2xl max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">💀</span>
          <div>
            <h3 className="text-white font-bold text-sm">MEGA NUCLEAR</h3>
            <p className="text-red-300 text-xs">Delete EVERYTHING</p>
          </div>
        </div>
        <button
          onClick={handleMegaNuclear}
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg font-bold text-white transition-all text-sm ${showConfirm ? "bg-red-700 hover:bg-red-800 animate-pulse" : "bg-red-900 hover:bg-red-800"}`}
        >
          {loading ? (
            <>⏳ Wiping...</>
          ) : showConfirm ? (
            <>⚠️ CLICK AGAIN TO CONFIRM</>
          ) : (
            <>💀 MEGA NUCLEAR WIPE</>
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
              <div className="font-bold text-red-300">DELETED:</div>
              <div>
                {result.deletedAuthUsers || 0}
                {" Auth users"}
              </div>
              <div>
                {result.totalKeysDeleted}
                {" total keys"}
              </div>
            </div>
            <div>
              <div className="font-bold text-red-300">VERIFICATION:</div>
              <div>
                {"Users: "}
                {result.verification?.remainingUsers || 0}
              </div>
              <div>
                {"Invitations: "}
                {result.verification?.remainingInvitations || 0}
              </div>
              <div>
                {"Auth Mappings: "}
                {result.verification?.remainingAuth || 0}
              </div>
              <div className="font-bold">
                {result.verification?.isEmpty
                  ? "✅ Database Empty"
                  : "❌ Not Empty"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
