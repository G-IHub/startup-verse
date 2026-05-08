import React, { useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { useAuth } from "../contexts/AuthContext";

/**
 * ADMIN DEBUG DATABASE COMPONENT
 * Shows exactly what's in the database to help debug deletion issues
 */

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export function AdminDebugDatabase() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dbData, setDbData] = useState(null);
  const handleInspect = async () => {
    setLoading(true);
    try {
      const currentUser = user;
      if (!currentUser?.id) {
        alert("No signed-in user.");
        setLoading(false);
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/team-members/${currentUser.id}`,
        defaultOptions,
      );
      const data = await response.json();
      setDbData({
        currentUser,
        teamMembersFromAPI: data,
        timestamp: new Date().toISOString(),
      });
      console.log("🔍 DATABASE INSPECTION:", {
        currentUser,
        teamMembersFromAPI: data,
      });
    } catch (error) {
      console.error("Database inspection error:", error);
      alert(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <div className="bg-blue-900 border-2 border-blue-500 rounded-lg p-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔍</span>
          <div>
            <h3 className="text-white font-bold">DATABASE DEBUG</h3>
            <p className="text-blue-200 text-xs">Development Only</p>
          </div>
        </div>
        <button
          onClick={handleInspect}
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg font-bold text-white bg-blue-700 hover:bg-blue-600 transition-all"
        >
          {loading ? <>⏳ Inspecting...</> : <>🔍 Inspect Database</>}
        </button>
        {dbData && (
          <div className="mt-3 p-3 bg-black/50 rounded text-xs text-white max-h-96 overflow-auto">
            <div className="mb-2">
              <div className="text-blue-300 font-bold mb-1">Current User:</div>
              <div>
                {"ID: "}
                {dbData.currentUser.id}
              </div>
              <div>
                {"Name: "}
                {dbData.currentUser.name}
              </div>
              <div>
                {"Role: "}
                {dbData.currentUser.role}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-blue-300 font-bold mb-1">
                Team Members (
                {dbData.teamMembersFromAPI?.teamMembers?.length || 0}):
              </div>
              {dbData.teamMembersFromAPI?.teamMembers?.length > 0 ? (
                dbData.teamMembersFromAPI.teamMembers.map((tm) => (
                  <div key={tm.id} className="mb-2 p-2 bg-gray-800 rounded">
                    <div>
                      {"ID: "}
                      {tm.id}
                    </div>
                    <div>
                      {"Name: "}
                      {tm.name}
                    </div>
                    <div>
                      {"Email: "}
                      {tm.email}
                    </div>
                    <div>
                      {"Role: "}
                      {tm.role}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic">
                  No team members found
                </div>
              )}
            </div>
            <div className="mt-2 text-gray-400 text-xs">
              {"Last updated: "}
              {new Date(dbData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
