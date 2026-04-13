/**
 * Backend Connection Test Utility
 * Run this from browser console to verify backend deployment
 */

import { getAccessToken } from "../app/session";
import { API_BASE_URL } from "../config/apiBase.js";

const BASE_URL = API_BASE_URL;

export async function testBackendConnection() {
  console.log("🧪 Testing StartupVerse Backend Connection...\n");
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // Test 1: Health Check
  console.log("Test 1: Health Check");
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();

    if (response.ok) {
      console.log("✅ Health check PASSED");
      console.log("   Status:", data.status);
      console.log("   Service:", data.service);
      console.log("   Version:", data.version);
      console.log("");
    } else {
      console.error("❌ Health check FAILED");
      console.error("   Status:", response.status);
      console.error("");
      return false;
    }
  } catch (error) {
    console.error("❌ Health check ERROR:", error);
    console.error("   This means the backend is not accessible");
    console.error("");
    return false;
  }

  // Test 2: Presence Update (POST)
  console.log("Test 2: Presence Update (POST)");
  try {
    const testData = {
      userId: "test-user-" + Date.now(),
      startupId: "test-startup",
      status: "active",
      cameraEnabled: false,
      activity: {
        type: "check-in",
        message: "Testing backend deployment",
        icon: "🧪",
        userName: "Test User",
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch(`${BASE_URL}/presence/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log("✅ Presence update PASSED");
      console.log("   Activity posted successfully");
      console.log("");
    } else {
      console.error("❌ Presence update FAILED");
      console.error("   Status:", response.status);
      console.error("   Response:", data);
      console.error("");
      return false;
    }
  } catch (error) {
    console.error("❌ Presence update ERROR:", error);
    console.error("");
    return false;
  }

  // Test 3: Get Activities (GET)
  console.log("Test 3: Get Activities (GET)");
  try {
    const response = await fetch(`${BASE_URL}/presence/test-startup`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log("✅ Get activities PASSED");
      console.log("   Activities found:", data.activities?.length || 0);
      console.log("   Active presence:", data.presence?.length || 0);
      console.log("");
    } else {
      console.error("❌ Get activities FAILED");
      console.error("   Status:", response.status);
      console.error("   Response:", data);
      console.error("");
      return false;
    }
  } catch (error) {
    console.error("❌ Get activities ERROR:", error);
    console.error("");
    return false;
  }

  // All tests passed!
  console.log("🎉 ALL TESTS PASSED!");
  console.log("");
  console.log("✅ Backend is deployed and working");
  console.log("✅ Activity sync will work automatically");
  console.log("✅ Refresh the page to see backend mode active");
  console.log("");
  console.log("Next steps:");
  console.log("1. Refresh the Virtual Office page");
  console.log('2. Console should show: "✅ Fetched X activities from backend"');
  console.log("3. No more warnings about backend not available");
  console.log("");

  return true;
}

// Auto-export for console use
if (typeof window !== "undefined") {
  window.testBackendConnection = testBackendConnection;
  console.log("💡 TIP: Run testBackendConnection() in console to test backend");
}
