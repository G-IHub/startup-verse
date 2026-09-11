/**
 * Offers API Client
 * Real compensation offers a founder sends a talent candidate.
 * Note: like founderApi.js (and unlike talentApi.js), apiCall here already
 * unwraps the {success, data} envelope — callers get the payload directly.
 */

import { request } from "../backendClient";

async function apiCall(endpoint, options = {}) {
  try {
    const payload = await request(endpoint, options);
    return payload.data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

export async function createOffer(offer) {
  return apiCall("/offers", {
    method: "POST",
    body: JSON.stringify({ offer }),
  });
}

export async function getSentOffers(founderId) {
  return apiCall(`/founders/${founderId}/offers`);
}

export async function getReceivedOffers(talentId) {
  return apiCall(`/talent/${talentId}/offers`);
}

export async function updateOfferStatus(offerId, status) {
  return apiCall(`/offers/${offerId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
