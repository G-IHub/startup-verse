// Task API wrapper for backend-first task management

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Get all tasks for a founder
 */
export async function getFounderTasks(founderId) {
  try {
    console.log(`📥 Fetching tasks for founder: ${founderId}`);

    const response = await fetch(`${API_BASE}/founders/${founderId}/tasks`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch founder tasks: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Loaded ${data.tasks?.length || 0} tasks from backend`);

    return data.tasks || [];
  } catch (error) {
    console.error("❌ Error fetching founder tasks:", error);
    throw error;
  }
}

/**
 * Get tasks assigned to a team member
 */
export async function getTeamMemberTasks(teamMemberId) {
  try {
    console.log(`📥 Fetching tasks for team member: ${teamMemberId}`);

    const response = await fetch(
      `${API_BASE}/team-members/${teamMemberId}/tasks`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Failed to fetch team member tasks:", errorData);
      throw new Error(
        `Failed to fetch team member tasks: ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(
      `✅ Loaded ${data.tasks?.length || 0} tasks assigned to team member`,
    );

    return data.tasks || [];
  } catch (error) {
    console.error("❌ Error fetching team member tasks:", error);
    throw error;
  }
}

/**
 * Save a task
 */
export async function saveTask(founderId, task) {
  try {
    const response = await fetch(`${API_BASE}/founders/${founderId}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save task: ${response.statusText}`);
    }

    console.log(`✅ Task ${task.id} saved to backend`);
  } catch (error) {
    console.error("❌ Error saving task:", error);
    throw error;
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  founderId,
  taskId,
  status,
  additionalData,
) {
  try {
    const response = await fetch(
      `${API_BASE}/founders/${founderId}/tasks/${taskId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          ...additionalData,
          updatedAt: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update task status: ${response.statusText}`);
    }

    console.log(`✅ Task ${taskId} status updated to ${status}`);
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

/**
 * Delete a task
 */
export async function deleteTask(founderId, taskId) {
  try {
    const response = await fetch(
      `${API_BASE}/founders/${founderId}/tasks/${taskId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }

    console.log(`✅ Task ${taskId} deleted from backend`);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}

/**
 * Assign task to a team member
 */
export async function assignTask(founderId, taskId, assigneeId, assigneeName) {
  try {
    const response = await fetch(
      `${API_BASE}/founders/${founderId}/tasks/${taskId}/assign`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId,
          assigneeName,
          assignedTo: assigneeId, // Also set assignedTo for compatibility
          assignedToName: assigneeName, // Also set assignedToName for compatibility
          assignedAt: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to assign task: ${response.statusText}`);
    }

    console.log(`✅ Task ${taskId} assigned to ${assigneeName}`);
  } catch (error) {
    console.error("Error assigning task:", error);
    throw error;
  }
}

/**
 * Get tasks with pagination support
 */
export async function getTasks(founderId, params) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.pageSize)
      queryParams.set("pageSize", params.pageSize.toString());
    if (params?.status) queryParams.set("status", params.status);
    if (params?.search) queryParams.set("search", params.search);

    const queryString = queryParams.toString();
    const url = `${API_BASE}/founders/${founderId}/tasks${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      tasks: data.tasks || [],
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}

/**
 * Get tasks by assignee with pagination support
 */
export async function getTasksByAssignee(assigneeId, params) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.pageSize)
      queryParams.set("pageSize", params.pageSize.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE}/team-members/${assigneeId}/tasks${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch tasks by assignee: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return {
      tasks: data.tasks || [],
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Error fetching tasks by assignee:", error);
    throw error;
  }
}
