/**
 * Optional: reserved for richer contract seeds (orgs/cohorts). Flow smoke currently self-signs up.
 * Run: RUN_CONTRACT_HTTP_FLOWS=1 node scripts/seed-contract-fixtures.mjs (no-op for now).
 */
if (process.env.RUN_CONTRACT_HTTP_FLOWS === "1") {
  console.log("seed-contract-fixtures: no-op (signup in phase1-http-contract-flows-smoke creates user).");
}
