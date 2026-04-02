export const APP_VIEWS = Object.freeze({
  accelerator: "accelerator",
  admin: "admin",
  aspiring: "aspiring",
  challenge: "challenge",
  choosePath: "choose-path",
  dashboard: "dashboard",
  home: "home",
  invitation: "invitation",
  landing: "landing",
  marketing: "marketing",
  mentorLogin: "mentor-login",
  profileSetup: "profile-setup",
  joinMeeting: "join-meeting",
  talentWaitlist: "talent-waitlist",
  waitlist: "waitlist",
});

export const STORAGE_KEYS = Object.freeze({
  authMigrationCompleted: "auth_migration_v1_completed",
  currentUser: "startupverse_user",
  founderProfiles: "startupverse_founder_profiles",
  registeredUsers: "startupverse_registered_users",
  talentProfiles: "startupverse_talent_profiles",
  teamMembers: "startupverse_users",
});

export function safeParseJson(raw, fallback) {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function resolveInitialView(location = window.location) {
  const { pathname, search } = location;
  const params = new URLSearchParams(search);

  if (pathname.startsWith("/mentor/login")) return APP_VIEWS.mentorLogin;
  if (pathname.startsWith("/join/")) return APP_VIEWS.joinMeeting;
  if (params.get("aspiring") === "true") return APP_VIEWS.aspiring;
  if (params.get("accelerator") === "true") return APP_VIEWS.accelerator;
  if (params.get("execution") === "true") return APP_VIEWS.challenge;
  if (params.get("challenge") === "true") return APP_VIEWS.challenge;
  if (params.get("marketing") === "true") return APP_VIEWS.marketing;
  if (params.get("waitlist") === "true") return APP_VIEWS.waitlist;
  if (params.get("talent") === "true") return APP_VIEWS.talentWaitlist;
  if (params.get("invitation")) return APP_VIEWS.invitation;
  if (params.get("admin") === "true") return APP_VIEWS.admin;

  return null;
}

export function readStoredList(key) {
  return safeParseJson(localStorage.getItem(key), []);
}

export function writeStoredList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function persistCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}

export function loadCurrentUser() {
  return safeParseJson(localStorage.getItem(STORAGE_KEYS.currentUser), null);
}

export function upsertStoredRecord(key, record) {
  const list = readStoredList(key);
  const index = list.findIndex(
    (entry) => entry?.email === record?.email || entry?.id === record?.id,
  );

  if (index >= 0) {
    list[index] = record;
  } else {
    list.push(record);
  }

  writeStoredList(key, list);
}

export function buildFounderProfile(user) {
  return {
    ...user.profile,
    founderId: user.id,
    founderName: user.name,
    founderEmail: user.email,
  };
}

export function buildTalentProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    professionalTitle: user.professionalTitle,
    location: user.location,
    bio: user.bio,
    skills: user.skills,
    linkedin: user.linkedin,
    github: user.github,
    website: user.website,
    workExperience: user.workExperience,
    education: user.education,
    certifications: user.certifications,
    portfolioItems: user.portfolioItems,
    availabilityStatus: user.availabilityStatus,
    preferredCommitment: user.preferredCommitment,
    yearsOfExperience: user.yearsOfExperience,
    professionalGoals: user.professionalGoals,
    industryPreferences: user.industryPreferences,
    experience: user.experience,
    availability: user.availability,
    interests: user.interests,
    ...user.profile,
  };
}
