import { request } from "../backendClient";

export async function getIntegrations(founderId) {
  const data = await request(`/founders/${founderId}/integrations`, { method: "GET" });
  return data?.data || data || [];
}

export async function connectGmail(founderId, { email, appPassword, displayName }) {
  const data = await request(`/founders/${founderId}/integrations/gmail/connect`, {
    method: "POST",
    body: JSON.stringify({ email, appPassword, displayName }),
  });
  return data?.data || data;
}

export async function disconnectGmail(founderId) {
  return request(`/founders/${founderId}/integrations/gmail`, { method: "DELETE" });
}

export async function sendOutreachEmail(founderId, { recipientEmail, recipientName, subject, htmlBody, agentEventId }) {
  const data = await request(`/founders/${founderId}/integrations/email/send`, {
    method: "POST",
    body: JSON.stringify({ recipientEmail, recipientName, subject, htmlBody, agentEventId }),
  });
  return data?.data || data;
}

export async function sendOutreachSequence(founderId, { recipientEmail, recipientName, steps, agentEventId }) {
  const data = await request(`/founders/${founderId}/integrations/email/sequence`, {
    method: "POST",
    body: JSON.stringify({ recipientEmail, recipientName, steps, agentEventId }),
  });
  return data?.data || data;
}

export async function getEmailHistory(founderId, { limit = 50, status } = {}) {
  const params = new URLSearchParams({ limit });
  if (status) params.set("status", status);
  const data = await request(`/founders/${founderId}/integrations/email/history?${params}`, { method: "GET" });
  return data?.data || data || [];
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export async function connectWhatsApp(founderId, { accessToken, phoneNumberId, displayName }) {
  const data = await request(`/founders/${founderId}/integrations/whatsapp/connect`, {
    method: "POST",
    body: JSON.stringify({ accessToken, phoneNumberId, displayName }),
  });
  return data?.data || data;
}

export async function disconnectWhatsApp(founderId) {
  return request(`/founders/${founderId}/integrations/whatsapp`, { method: "DELETE" });
}

export async function sendWhatsAppOutreach(founderId, { recipientPhone, message }) {
  const data = await request(`/founders/${founderId}/integrations/whatsapp/send`, {
    method: "POST",
    body: JSON.stringify({ recipientPhone, message }),
  });
  return data?.data || data;
}

// ─── LinkedIn OAuth posting ───────────────────────────────────────────────────

export async function getLinkedInAuthUrl(founderId) {
  const data = await request(`/founders/${founderId}/integrations/linkedin/oauth/start`, { method: "GET" });
  return data;
}

export async function postToLinkedIn(founderId, text) {
  const data = await request(`/founders/${founderId}/integrations/linkedin/post`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return data?.data || data;
}

export async function disconnectLinkedIn(founderId) {
  return request(`/founders/${founderId}/integrations/linkedin`, { method: "DELETE" });
}

// ─── Social profiles (Instagram, Facebook) ───────────────────────────────────

export async function connectSocial(founderId, { type, profileUrl, displayName }) {
  const data = await request(`/founders/${founderId}/integrations/social/connect`, {
    method: "POST",
    body: JSON.stringify({ type, profileUrl, displayName }),
  });
  return data?.data || data;
}

export async function disconnectSocial(founderId, type) {
  return request(`/founders/${founderId}/integrations/social/${type}`, { method: "DELETE" });
}
