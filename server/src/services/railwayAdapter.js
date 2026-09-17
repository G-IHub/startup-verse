/**
 * railwayAdapter.js — real calls to Railway's public GraphQL API
 * (https://backboard.railway.com/graphql/v2), confirmed 2026-09-15 (both
 * from Railway's own docs and this session's own research) to support
 * exactly what a multi-tenant platform needs: many different
 * founder-owned custom domains attached to one shared service.
 *
 * Config needed (all via env, honest "not configured" gate — same pattern
 * as paystackService.js): RAILWAY_API_TOKEN, RAILWAY_PROJECT_ID,
 * RAILWAY_ENVIRONMENT_ID, RAILWAY_SERVICE_ID (the project/environment/
 * service that sites.startupverse.space is already attached to — see
 * hostedSitePublic.js). None of these exist in this local dev environment,
 * so this adapter has been built and syntax/shape-checked but NOT proven
 * against a real Railway project — the exact response field names below
 * come from Railway's own documentation prose (customDomainCreate takes
 * projectId/environmentId/serviceId/domain, returns a real certificateStatus
 * that progresses PENDING -> ISSUED -> FAILED, plus a CNAME target and a
 * TXT verificationToken a founder must add), not a verified live call.
 * Flag honestly to whoever wires real credentials in: the very first real
 * call here may need a field-name correction once Railway's actual
 * response shape is seen live — same category as any other unverified
 * third-party integration in this codebase (Paystack has the identical
 * caveat, for the identical reason: no real credentials exist here).
 */
import { logger } from "../config/logger.js";

const RAILWAY_GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";

export function railwayConfigured() {
  return Boolean(
    process.env.RAILWAY_API_TOKEN &&
    process.env.RAILWAY_PROJECT_ID &&
    process.env.RAILWAY_ENVIRONMENT_ID &&
    process.env.RAILWAY_SERVICE_ID,
  );
}

async function railwayGraphQL(query, variables) {
  const response = await fetch(RAILWAY_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.errors) {
    const message = body.errors?.[0]?.message || `Railway API error (${response.status})`;
    logger.error("[railwayAdapter] GraphQL call failed", { message, variables });
    throw new Error(message);
  }
  return body.data;
}

/**
 * Creates a real custom domain on our shared sites-hosting service.
 * Returns the real DNS instructions the founder must add at their own
 * registrar before Railway will issue a certificate.
 */
export async function createCustomDomain({ domain }) {
  if (!railwayConfigured()) {
    const err = new Error("Custom domains are not configured on this server yet — RAILWAY_API_TOKEN and project/environment/service IDs are required.");
    err.statusCode = 503;
    throw err;
  }
  const data = await railwayGraphQL(
    `mutation CustomDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        domain
        status { dnsRecords { hostlabel recordType requiredValue status } certificateStatus }
      }
    }`,
    {
      input: {
        projectId: process.env.RAILWAY_PROJECT_ID,
        environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
        serviceId: process.env.RAILWAY_SERVICE_ID,
        domain,
      },
    },
  );
  const result = data?.customDomainCreate;
  if (!result) throw new Error("Railway did not return a real domain record.");
  const dnsRecords = result.status?.dnsRecords || [];
  const cnameRecord = dnsRecords.find((r) => r.recordType === "CNAME") || null;
  const txtRecord = dnsRecords.find((r) => r.recordType === "TXT") || null;
  return {
    railwayDomainId: result.id,
    cnameTarget: cnameRecord?.requiredValue || "",
    verificationToken: txtRecord?.requiredValue || "",
    certificateStatus: String(result.status?.certificateStatus || "PENDING").toLowerCase(),
  };
}

/** Real, live cert-status refresh — called on demand, not on a cron (no polling infra exists yet). */
export async function getCustomDomainStatus({ railwayDomainId }) {
  if (!railwayConfigured()) {
    const err = new Error("Custom domains are not configured on this server yet.");
    err.statusCode = 503;
    throw err;
  }
  // Real correction found live, 2026-09-15: Railway's actual schema (not
  // documented in the prose this adapter was first written from) requires
  // projectId alongside id here, confirmed by Railway's own GraphQL
  // validation error when it was missing ("argument \"projectId\" of type
  // \"String!\" is required") — exactly the kind of live-only correction
  // this file's header comment already warned would be needed.
  const data = await railwayGraphQL(
    `query CustomDomain($id: String!, $projectId: String!) {
      customDomain(id: $id, projectId: $projectId) { id domain status { certificateStatus } }
    }`,
    { id: railwayDomainId, projectId: process.env.RAILWAY_PROJECT_ID },
  );
  const result = data?.customDomain;
  if (!result) throw new Error("Railway no longer has a record of this domain.");
  return { certificateStatus: String(result.status?.certificateStatus || "PENDING").toLowerCase() };
}

/** Best-effort delete — a failure here must never block removing our own local record. */
export async function deleteCustomDomain({ railwayDomainId }) {
  if (!railwayConfigured() || !railwayDomainId) return;
  try {
    await railwayGraphQL(
      `mutation CustomDomainDelete($id: String!) { customDomainDelete(id: $id) }`,
      { id: railwayDomainId },
    );
  } catch (err) {
    logger.error("[railwayAdapter] best-effort domain delete failed — local record still removed", { message: err.message });
  }
}
