/**
 * TEAM HELPERS
 * Centralized functions for loading and managing team data across the platform
 */

/**
 * Get all team members for a specific company
 * This is the single source of truth for team data across the platform
 */
export const getTeamMembers = (companyId, excludeUserId) => {
  if (!companyId) {
    return [];
  }

  const allUsers = JSON.parse(
    localStorage.getItem("startupverse_users") || "[]",
  );

  return allUsers
    .filter(
      (u) => u.companyId === companyId && u.id !== excludeUserId, // Exclude the current user if needed
    )
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.profile?.title || u.role,
      title: u.profile?.title,
      avatar: u.profile?.avatar,
      department: u.profile?.department,
      skills: u.profile?.skills || [],
      companyId: u.companyId,
      companyName: u.companyName,
    }));
};

/**
 * Get all team members INCLUDING the current user
 */
export const getAllCompanyMembers = (companyId) => {
  if (!companyId) {
    return [];
  }

  const allUsers = JSON.parse(
    localStorage.getItem("startupverse_users") || "[]",
  );

  return allUsers
    .filter((u) => u.companyId === companyId)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.profile?.title || u.role,
      title: u.profile?.title,
      avatar: u.profile?.avatar,
      department: u.profile?.department,
      skills: u.profile?.skills || [],
      companyId: u.companyId,
      companyName: u.companyName,
    }));
};

/**
 * Get a specific team member by ID
 */
export const getTeamMemberById = (userId) => {
  const allUsers = JSON.parse(
    localStorage.getItem("startupverse_users") || "[]",
  );
  const user = allUsers.find((u) => u.id === userId);

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.profile?.title || user.role,
    title: user.profile?.title,
    avatar: user.profile?.avatar,
    department: user.profile?.department,
    skills: user.profile?.skills || [],
    companyId: user.companyId,
    companyName: user.companyName,
  };
};

/**
 * Get team members formatted for dropdown/select components
 */
export const getTeamMembersForSelect = (companyId, excludeUserId) => {
  const members = getTeamMembers(companyId, excludeUserId);

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar,
    title: m.title,
  }));
};

/**
 * Get company information
 */
export const getCompanyInfo = (companyId) => {
  if (!companyId) return null;

  const companies = JSON.parse(
    localStorage.getItem("startupverse_companies") || "[]",
  );
  return companies.find((c) => c.id === companyId) || null;
};

/**
 * Check if a user is part of a company
 */
export const isUserInCompany = (userId, companyId) => {
  const allUsers = JSON.parse(
    localStorage.getItem("startupverse_users") || "[]",
  );
  const user = allUsers.find((u) => u.id === userId);
  return user?.companyId === companyId;
};

/**
 * Get team size (including all roles)
 */
export const getTeamSize = (companyId) => {
  if (!companyId) return 0;
  return getAllCompanyMembers(companyId).length;
};
