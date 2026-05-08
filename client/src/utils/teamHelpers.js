/**
 * TEAM HELPERS
 * Team lists come from the API (e.g. GET /founders/:id/team-members).
 * These stubs remain for legacy call sites that expect synchronous helpers.
 */

export const getTeamMembers = (_companyId, _excludeUserId) => [];

export const getAllCompanyMembers = (_companyId) => [];

export const getTeamMemberById = (_userId) => null;

export const getTeamMembersForSelect = (companyId, excludeUserId) => {
  const members = getTeamMembers(companyId, excludeUserId);
  return members.map((m) => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar,
    title: m.title,
  }));
};

export const getCompanyInfo = (_companyId) => null;

export const isUserInCompany = (_userId, _companyId) => false;

export const getTeamSize = (_companyId) => 0;
