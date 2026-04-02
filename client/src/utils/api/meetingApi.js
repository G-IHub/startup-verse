const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export async function createMeeting(meeting) {
  try {
    const response = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify(meeting),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to create meeting:", error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, meeting: data.meeting };
  } catch (error) {
    console.error("Error creating meeting:", error);
    return { success: false, error: error.message };
  }
}

export async function getStartupMeetings(startupId) {
  try {
    const response = await fetch(`${API_BASE}/meetings/startup/${startupId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch meetings");
    }

    const data = await response.json();
    return data.meetings || [];
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
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, meeting: data.meeting };
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
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
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
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user meetings");
    }

    const data = await response.json();
    return data.meetings || [];
  } catch (error) {
    console.error("Error fetching user meetings:", error);
    return [];
  }
}
