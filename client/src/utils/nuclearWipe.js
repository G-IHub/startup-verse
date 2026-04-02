/**
 * 🔥 MEGA NUCLEAR WIPE UTILITY
 * Completely wipes ALL data from frontend and backend
 */

export async function executeNuclearWipe() {
  console.log("🔥🔥🔥 STARTING MEGA NUCLEAR WIPE 🔥🔥🔥");

  let success = true;

  // Step 1: Clear ALL backend database data
  console.log("🔥 Step 1: Clearing ALL database records...");
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/admin/clear-all-data`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Database cleared: ${data.deletedKeys} records deleted`);
      console.log(`📊 Breakdown:`, data.categories);
    } else {
      console.error("❌ Failed to clear database:", data);
      success = false;
    }
  } catch (error) {
    console.error("❌ Error calling backend clear:", error);
    success = false;
  }

  // Step 2: Clear ALL localStorage
  console.log("🔥 Step 2: Clearing ALL localStorage...");
  try {
    // List all keys before clearing
    const keys = Object.keys(localStorage);
    console.log(`📋 Found ${keys.length} localStorage keys:`, keys);

    // List all the StartupVerse keys for verification
    const startupVerseKeys = keys.filter(
      (k) =>
        k.includes("startupverse") ||
        k.includes("user") ||
        k.includes("talent") ||
        k.includes("founder") ||
        k.includes("auth") ||
        k.includes("organization") ||
        k.includes("cohort"),
    );
    console.log(
      `📋 StartupVerse keys to delete: ${startupVerseKeys.length}`,
      startupVerseKeys,
    );

    // Clear everything
    localStorage.clear();

    // Verify it's actually cleared
    const remainingKeys = Object.keys(localStorage);
    console.log(
      `✅ localStorage cleared. Remaining keys: ${remainingKeys.length}`,
    );

    if (remainingKeys.length > 0) {
      console.warn(
        `⚠️ Warning: ${remainingKeys.length} keys still remain:`,
        remainingKeys,
      );
    }
  } catch (error) {
    console.error("❌ Error clearing localStorage:", error);
    success = false;
  }

  // Step 3: Clear ALL sessionStorage
  console.log("🔥 Step 3: Clearing ALL sessionStorage...");
  try {
    sessionStorage.clear();
    console.log("✅ sessionStorage cleared");
  } catch (error) {
    console.error("❌ Error clearing sessionStorage:", error);
    success = false;
  }

  // Step 4: Clear ALL cookies
  console.log("🔥 Step 4: Clearing ALL cookies...");
  try {
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    console.log("✅ Cookies cleared");
  } catch (error) {
    console.error("❌ Error clearing cookies:", error);
    success = false;
  }

  // Step 5: Clear IndexedDB (if any)
  console.log("🔥 Step 5: Clearing IndexedDB...");
  try {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
        console.log(`✅ Deleted IndexedDB: ${db.name}`);
      }
    }
  } catch (error) {
    console.error("❌ Error clearing IndexedDB:", error);
    // Don't fail on this - not all browsers support it
  }

  // Step 6: Clear Service Workers
  console.log("🔥 Step 6: Unregistering Service Workers...");
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log("✅ Unregistered service worker");
      }
    }
  } catch (error) {
    console.error("❌ Error clearing service workers:", error);
    // Don't fail on this
  }

  // Step 7: Clear Cache Storage
  console.log("🔥 Step 7: Clearing Cache Storage...");
  try {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`✅ Deleted cache: ${cacheName}`);
      }
    }
  } catch (error) {
    console.error("❌ Error clearing caches:", error);
    // Don't fail on this
  }

  console.log("🔥🔥🔥 MEGA NUCLEAR WIPE COMPLETE 🔥🔥🔥");
  console.log(
    `Result: ${success ? "✅ SUCCESS" : "⚠️ PARTIAL SUCCESS (check errors above)"}`,
  );

  return success;
}

/**
 * Execute nuclear wipe and redirect to home
 */
export async function nuclearWipeAndRestart() {
  const success = await executeNuclearWipe();

  // Always redirect, even if partial success
  console.log("🔄 Redirecting to home page in 1 second...");
  setTimeout(() => {
    window.location.href = "/";
  }, 1000);

  return success;
}

// Expose globally for console access
if (typeof window !== "undefined") {
  window.nuclearWipe = nuclearWipeAndRestart;
  console.log("💡 TIP: Run nuclearWipe() in console to clear everything!");
}
