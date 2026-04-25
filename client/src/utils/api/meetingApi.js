import { getAccessToken } from "../../app/session";
import { API_BASE_URL } from "../../config/apiBase.js";

const API_BASE = API_BASE_URL;

export async function createMeeting(meeting) {
  try {
    const response = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(meeting),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to create meeting:", error);
      return { success: false, error };
    }

    const data = await response.json();
    const payload = data.data || data;
    return { success: true, meeting: payload.meeting || null, meetingCount: payload.meetingCount || 1 };
  } catch (error) {
    console.error("Error creating meeting:", error);
    return { success: false, error: error.message };
  }
}

export async function getStartupMeetings(startupId) {
  try {
    const response = await fetch(`${API_BASE}/meetings/startup/${startupId}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch meetings");
    }

    const data = await response.json();
    const payload = data.data || data;
    return payload.meetings || [];
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return [];
  }
}

export async function updateMeeting(meetingId, updates) {
  try {
    const response = await fetch(`${API_BASE}/meetings/${meetingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    const payload = data.data || data;
    return { success: true, meeting: payload.meeting || null };
  } catch (error) {
    console.error("Error updating meeting:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteMeeting(meetingId) {
  try {
    const response = await fetch(`${API_BASE}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserMeetings(userId) {
  try {
    const response = await fetch(`${API_BASE}/meetings/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user meetings");
    }

    const data = await response.json();
    const payload = data.data || data;
    return payload.meetings || [];
  } catch (error) {
    console.error("Error fetching user meetings:", error);
    return [];
  }
}
