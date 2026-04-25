/**
 * Talent API Client
 *
 * Handles all API calls for Talent users to the backend.
 * Follows the same pattern as founderApi and teamMemberApi.
 */
import { getAccessToken } from "../../app/session";
import { API_BASE_URL } from "../../config/apiBase.js";

const API_BASE = API_BASE_URL;

// Pagination types

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Helper to build query string from params
function buildQueryString(params) {
  const query = new URLSearchParams();

  if (params.page) query.append("page", params.page.toString());
  if (params.pageSize) query.append("pageSize", params.pageSize.toString());
  if (params.search) query.append("search", params.search);

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, value.toString());
      }
    });
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

/**
 * Save or update talent profile
 */
export async function saveTalentProfile(userId, profileData) {
  // Normalize field names from the user object to TalentProfile schema names
  const normalized = {
    fullName: profileData?.fullName || profileData?.name || "",
    professionalTitle: profileData?.professionalTitle || "",
    headline: profileData?.headline || profileData?.professionalTitle || "",
    location: profileData?.location || "",
    bio: profileData?.bio || "",
    professionalGoals: profileData?.professionalGoals || "",
    skills: profileData?.skills || [],
    yearsOfExperience: profileData?.yearsOfExperience || "",
    availability: profileData?.availability || "open",
    availabilityStatus: profileData?.availabilityStatus || "",
    preferredCommitment: profileData?.preferredCommitment || "",
    linkedinUrl: profileData?.linkedinUrl || profileData?.linkedin || "",
    githubUrl: profileData?.githubUrl || profileData?.github || "",
    websiteUrl: profileData?.websiteUrl || profileData?.website || "",
    portfolioLinks: profileData?.portfolioLinks || [],
    preferredRoles: profileData?.preferredRoles || [],
    industryPreferences: profileData?.industryPreferences || [],
    interests: profileData?.interests || [],
    workExperiences: profileData?.workExperiences || profileData?.workExperience || [],
    educationList: profileData?.educationList || profileData?.education || [],
    certifications: profileData?.certifications || [],
    portfolioItems: profileData?.portfolioItems || [],
  };

  return apiCall("/talent/profile", {
    method: "POST",
    body: JSON.stringify({ userId, profileData: normalized }),
  });
}

/**
 * Get talent profile by ID
 */
export async function getTalentProfile(userId) {
  return apiCall(`/talent/profile/${userId}`, {
    method: "GET",
  });
}

/**
 * Browse all talent profiles (for Founders)
 * Now supports pagination, search, and filters
 */
export async function browseTalents(params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/talent/browse${queryString}`, {
    method: "GET",
  });
}

// ==========================================
// APPLICATION MANAGEMENT
// ==========================================

/**
 * Submit application to a startup/opportunity
 */
export async function submitApplication(talentId, applicationData) {
  return apiCall(`/talent/${talentId}/applications`, {
    method: "POST",
    body: JSON.stringify(applicationData),
  });
}

/**
 * Get all applications for a talent user
 */
export async function getTalentApplications(talentId, params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/talent/${talentId}/applications${queryString}`, {
    method: "GET",
  });
}

// ==========================================
// SAVED JOBS / FAVORITES
// ==========================================

/**
 * Save/favorite a job or startup
 */
export async function saveItem(talentId, itemData) {
  return apiCall(`/talent/${talentId}/saved`, {
    method: "POST",
    body: JSON.stringify(itemData),
  });
}

/**
 * Get talent's saved items
 * Now supports pagination
 */
export async function getSavedItems(talentId, params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/talent/${talentId}/saved${queryString}`, {
    method: "GET",
  });
}

/**
 * Remove item from saved/favorites
 */
export async function removeSavedItem(talentId, itemType, itemId) {
  return apiCall(`/talent/${talentId}/saved/${itemType}/${itemId}`, {
    method: "DELETE",
  });
}

// ==========================================
// SMART MATCHING
// ==========================================

/**
 * Get matched opportunities for talent (algorithm-based)
 * Now supports pagination
 */
export async function getMatchedOpportunities(talentId, params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/talent/${talentId}/matches${queryString}`, {
    method: "GET",
  });
}

// ==========================================
// OPPORTUNITIES / JOB BROWSING
// ==========================================

/**
 * Get all available opportunities (posted by Founders)
 * Now supports pagination and search
 */
export async function getOpportunities(params = {}) {
  const queryString = buildQueryString(params);
  return apiCall(`/talent/opportunities${queryString}`, {
    method: "GET",
  });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Extract data from API response
 */
export function extractData(response, key) {
  if (!response.success) {
    throw new Error(response.error || "API call failed");
  }
  return response[key];
}

/**
 * Handle API errors gracefully
 */
export function handleApiError(error, fallbackMessage = "An error occurred") {
  console.error("Talent API Error:", error);
  return {
    error: error.message || fallbackMessage,
    success: false,
  };
}
