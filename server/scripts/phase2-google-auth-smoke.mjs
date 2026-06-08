import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd());
const src = path.join(root, "src");
const clientRoot = path.resolve(root, "..", "client");

async function read(absPath) {
  return fs.readFile(absPath, "utf8");
}

function assertContains(content, needle, label, failures) {
  if (!content.includes(needle)) failures.push(`Missing ${label}: ${needle}`);
}

async function main() {
  const failures = [];

  const [
    authController,
    authRoutes,
    userModel,
    serverPackage,
    clientPackage,
    clientMain,
    loginPage,
    signupForm,
    googleButton,
    authApi,
  ] = await Promise.all([
    read(path.join(src, "controllers", "auth.controller.js")),
    read(path.join(src, "routes", "auth.routes.js")),
    read(path.join(src, "models", "User.js")),
    read(path.join(root, "package.json")),
    read(path.join(clientRoot, "package.json")),
    read(path.join(clientRoot, "src", "main.jsx")),
    read(path.join(clientRoot, "src", "components", "LoginPage.jsx")),
    read(path.join(clientRoot, "src", "components", "auth", "AuthSignupForm.jsx")),
    read(path.join(clientRoot, "src", "components", "auth", "GoogleAuthButton.jsx")),
    read(path.join(clientRoot, "src", "api", "authApi.jsx")),
  ]);

  assertContains(serverPackage, "google-auth-library", "server Google verifier dependency", failures);
  assertContains(clientPackage, "@react-oauth/google", "client Google OAuth dependency", failures);

  assertContains(authRoutes, '"/auth/google"', "Google auth route", failures);
  assertContains(authController, "verifyIdToken", "Google ID token verification", failures);
  assertContains(authController, "GOOGLE_CLIENT_ID", "Google audience env lookup", failures);
  assertContains(authController, "email_verified !== true", "verified email enforcement", failures);
  assertContains(authController, "Please sign up first", "unknown login account rejection", failures);
  assertContains(authController, 'authProviders: ["google"]', "Google-only signup provider", failures);
  assertContains(authController, 'addProvider(user, "google")', "existing account Google linking", failures);

  assertContains(userModel, "googleId", "user Google id field", failures);
  assertContains(userModel, "authProviders", "user auth providers field", failures);
  assertContains(userModel, "emailVerified", "user verified email field", failures);
  assertContains(userModel, "if (!this.password)", "password compare guard", failures);

  assertContains(clientMain, "GoogleOAuthProvider", "Google provider wrapper", failures);
  assertContains(authApi, "/auth/google", "client Google auth API method", failures);
  assertContains(loginPage, "GoogleAuthButton", "login Google button wiring", failures);
  assertContains(signupForm, "role={role}", "role-selected Google signup wiring", failures);
  assertContains(googleButton, "GoogleLogin", "Google Identity Services button", failures);

  if (failures.length) {
    console.error("Phase 2 Google auth smoke FAILED");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("Phase 2 Google auth smoke PASSED");
}

main().catch((error) => {
  console.error("Phase 2 Google auth smoke crashed:", error);
  process.exit(1);
});
