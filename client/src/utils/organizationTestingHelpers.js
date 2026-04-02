/**
 * Quick setup for organization testing with real users
 * Adds Abraham and other test users to localStorage
 */
export function setupOrgTestingWithRealUser() {
  console.log("🚀 Setting up organization testing environment...");

  // Add Abraham
  addAbrahamToLocalStorage();

  // Add a few more test founders
  addRealUserToLocalStorage(
    "test.founder@startup.com",
    "Test Founder",
    "Test Startup Inc",
  );
  addRealUserToLocalStorage(
    "jane.smith@techco.com",
    "Jane Smith",
    "TechCo Solutions",
  );
  addRealUserToLocalStorage(
    "john.doe@innovate.com",
    "John Doe",
    "Innovate Labs",
  );

  console.log("");
  console.log("✅ Organization testing environment ready!");
  console.log("");
  console.log("📧 You can now search for these founders:");
  console.log("   - seyimba1234@gmail.com (Abraham Olawale)");
  console.log("   - test.founder@startup.com (Test Founder)");
  console.log("   - jane.smith@techco.com (Jane Smith)");
  console.log("   - john.doe@innovate.com (John Doe)");
  console.log("");
  console.log(
    "💡 Tip: Run listFoundersInLocalStorage() to see all available founders",
  );
}

/**
 * Quick function to add multiple test founders at once
 */
export function addTestFoundersForOrgs() {
  console.log("➕ Adding test founders for organization testing...");

  const testFounders = [
    {
      email: "sarah.johnson@healthtech.com",
      name: "Sarah Johnson",
      startup: "HealthTech Plus",
    },
    {
      email: "mike.chen@financeai.com",
      name: "Mike Chen",
      startup: "FinanceAI",
    },
    {
      email: "lisa.garcia@edutech.com",
      name: "Lisa Garcia",
      startup: "EduTech Solutions",
    },
    {
      email: "david.kim@greentech.com",
      name: "David Kim",
      startup: "GreenTech Innovations",
    },
    {
      email: "emma.brown@socialapp.com",
      name: "Emma Brown",
      startup: "SocialApp Co",
    },
  ];

  testFounders.forEach((founder) => {
    addRealUserToLocalStorage(founder.email, founder.name, founder.startup);
  });

  console.log("✅ Added 5 test founders to localStorage");
  console.log("");
  console.log("📧 Search for any of these emails:");
  testFounders.forEach((f) => console.log(`   - ${f.email} (${f.name})`));
}
