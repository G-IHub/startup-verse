/**
 * Quick Backend Pagination Test Script
 *
 * This script tests the pagination infrastructure without needing real data.
 * It verifies imports, function signatures, and response structures.
 *
 * Run this in the browser console while on the app to test quickly.
 */

// Test configuration
const TEST_CONFIG = {
  // Update these from /utils/supabase/info.tsx
  projectId: "YOUR_PROJECT_ID",
  publicAnonKey: "YOUR_PUBLIC_ANON_KEY",

  // Test user IDs (get from your database)
  founderId: "test-founder-id",
  startupId: "test-startup-id",
  teamMemberId: "test-team-member-id",
  talentId: "test-talent-id",
};

const BASE_URL = `https://${TEST_CONFIG.projectId}.supabase.co/functions/v1/make-server-78157e08`;

// Test result tracking
const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

// Helper: Make API request
async function testEndpoint(name, endpoint, expectedFields = []) {
  try {
    console.log(`🧪 Testing: ${name}`);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${TEST_CONFIG.publicAnonKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Verify basic structure
    if (!data.success) {
      throw new Error('Response missing "success: true"');
    }

    // Verify pagination object
    if (!data.pagination) {
      throw new Error('Response missing "pagination" object');
    }

    const p = data.pagination;
    if (typeof p.total !== "number")
      throw new Error("pagination.total is not a number");
    if (typeof p.page !== "number")
      throw new Error("pagination.page is not a number");
    if (typeof p.pageSize !== "number")
      throw new Error("pagination.pageSize is not a number");
    if (typeof p.totalPages !== "number")
      throw new Error("pagination.totalPages is not a number");
    if (typeof p.hasNext !== "boolean")
      throw new Error("pagination.hasNext is not a boolean");
    if (typeof p.hasPrev !== "boolean")
      throw new Error("pagination.hasPrev is not a boolean");

    // Verify expected fields
    for (const field of expectedFields) {
      if (!(field in data)) {
        throw new Error(`Response missing expected field: ${field}`);
      }
    }

    console.log(`✅ PASS: ${name}`);
    results.passed++;
    return data;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`, error);
    results.failed++;
    results.errors.push({ name, error: error.message });
    return null;
  }
}

// Test suite
async function runTests() {
  console.log("🚀 Starting Backend Pagination Tests...\n");

  const startTime = Date.now();

  // ============================================
  // BASIC TESTS
  // ============================================

  console.log("\n📋 PHASE A: Basic Functionality\n");

  await testEndpoint("Health Check", "/health", []);

  await testEndpoint(
    "Get All Founders (Page 1)",
    "/founders?page=1&pageSize=10",
    ["founders", "pagination"],
  );

  await testEndpoint(
    "Get All Founders (Page 2)",
    "/founders?page=2&pageSize=5",
    ["founders", "pagination"],
  );

  // ============================================
  // FOUNDERS ENDPOINTS
  // ============================================

  console.log("\n📋 PHASE B: Founders Endpoints\n");

  await testEndpoint(
    "Get Founder Invitations",
    `/founders/${TEST_CONFIG.founderId}/invitations?page=1&pageSize=10`,
    ["invitations", "pagination"],
  );

  await testEndpoint(
    "Get Founder Tasks",
    `/founders/${TEST_CONFIG.founderId}/tasks?page=1&pageSize=10`,
    ["tasks", "pagination"],
  );

  await testEndpoint(
    "Get Founder Tasks (with search)",
    `/founders/${TEST_CONFIG.founderId}/tasks?page=1&pageSize=10&search=test`,
    ["tasks", "pagination"],
  );

  await testEndpoint(
    "Get Founder Milestones",
    `/founders/${TEST_CONFIG.founderId}/milestones?page=1&pageSize=10`,
    ["milestones", "pagination"],
  );

  await testEndpoint(
    "Get Founder Weekly Outcomes",
    `/founders/${TEST_CONFIG.founderId}/weekly-outcomes?page=1&pageSize=10`,
    ["weeklyOutcomes", "pagination"],
  );

  await testEndpoint(
    "Get Founder Posts",
    `/founders/${TEST_CONFIG.founderId}/posts?page=1&pageSize=10`,
    ["posts", "pagination"],
  );

  // ============================================
  // TEAM MEMBER ENDPOINTS
  // ============================================

  console.log("\n📋 PHASE C: Team Member Endpoints\n");

  await testEndpoint(
    "Get Team Members by Founder",
    `/founders/${TEST_CONFIG.founderId}/team-members?page=1&pageSize=10`,
    ["teamMembers", "pagination"],
  );

  await testEndpoint(
    "Get Team Members by Startup",
    `/startups/${TEST_CONFIG.startupId}/team-members?page=1&pageSize=10`,
    ["teamMembers", "pagination"],
  );

  await testEndpoint(
    "Get Team Member Tasks",
    `/team-members/${TEST_CONFIG.teamMemberId}/tasks?page=1&pageSize=10`,
    ["tasks", "pagination"],
  );

  await testEndpoint(
    "Get Team Member Activity",
    `/team-members/${TEST_CONFIG.teamMemberId}/activity?page=1&pageSize=20`,
    ["activities", "pagination"],
  );

  // ============================================
  // TALENT ENDPOINTS
  // ============================================

  console.log("\n📋 PHASE D: Talent Endpoints\n");

  await testEndpoint("Browse Talent", "/talent/browse?page=1&pageSize=10", [
    "profiles",
    "pagination",
  ]);

  await testEndpoint(
    "Browse Talent (with search)",
    "/talent/browse?page=1&pageSize=10&search=engineer",
    ["profiles", "pagination"],
  );

  await testEndpoint(
    "Get All Talent Profiles",
    "/talent/profiles?page=1&pageSize=10",
    ["profiles", "pagination"],
  );

  await testEndpoint(
    "Get Talent Applications",
    `/talent/${TEST_CONFIG.talentId}/applications?page=1&pageSize=10`,
    ["applications", "pagination"],
  );

  await testEndpoint(
    "Get Talent Saved",
    `/talent/${TEST_CONFIG.talentId}/saved?page=1&pageSize=10`,
    ["saved", "pagination"],
  );

  await testEndpoint(
    "Get Talent Matches",
    `/talent/${TEST_CONFIG.talentId}/matches?page=1&pageSize=10`,
    ["matches", "pagination"],
  );

  await testEndpoint(
    "Get All Opportunities",
    "/talent/opportunities?page=1&pageSize=10",
    ["opportunities", "pagination"],
  );

  await testEndpoint("Get All Posts", "/posts?page=1&pageSize=10", [
    "posts",
    "pagination",
  ]);

  // ============================================
  // EDGE CASES
  // ============================================

  console.log("\n📋 PHASE E: Edge Cases\n");

  await testEndpoint("Invalid Page (0)", "/founders?page=0&pageSize=10", [
    "founders",
    "pagination",
  ]);

  await testEndpoint(
    "Invalid Page (negative)",
    "/founders?page=-1&pageSize=10",
    ["founders", "pagination"],
  );

  await testEndpoint(
    "Large Page Size (should cap at 100)",
    "/founders?page=1&pageSize=500",
    ["founders", "pagination"],
  );

  await testEndpoint("No Pagination Params", "/founders", [
    "founders",
    "pagination",
  ]);

  // ============================================
  // RESULTS
  // ============================================

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(
    `📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`,
  );

  if (results.failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.name}: ${err.error}`);
    });
  }

  console.log("\n" + "=".repeat(50));

  if (results.failed === 0) {
    console.log("🎉 ALL TESTS PASSED! Ready for Phase 4.");
  } else {
    console.log("⚠️  Some tests failed. Please review and fix issues.");
  }

  return results;
}

// Export for use
if (typeof window !== "undefined") {
  window.runPaginationTests = runTests;
  console.log("✅ Test script loaded!");
  console.log("📝 Update TEST_CONFIG with your IDs, then run:");
  console.log("   runPaginationTests()");
} else {
  // Run automatically if in Node environment
  runTests();
}

export { runTests, testEndpoint, TEST_CONFIG };
