import { request } from "../backendClient";

export async function generateSalesOutput(founderId, actionKey, payload = {}) {
  const data = await request(`/founders/${founderId}/agents/sales/generate`, {
    method: "POST",
    body: JSON.stringify({ actionKey, payload }),
  });
  return data?.data || data;
}

export async function generateMarketingOutput(founderId, actionKey, payload = {}) {
  const data = await request(`/founders/${founderId}/agents/mkt/generate`, {
    method: "POST",
    body: JSON.stringify({ actionKey, payload }),
  });
  return data?.data || data;
}

export async function getSalesOutputs(founderId) {
  const data = await request(`/founders/${founderId}/agents/sales/outputs`, { method: "GET" });
  return data?.data || data || [];
}

export async function getMarketingOutputs(founderId) {
  const data = await request(`/founders/${founderId}/agents/mkt/outputs`, { method: "GET" });
  return data?.data || data || [];
}
