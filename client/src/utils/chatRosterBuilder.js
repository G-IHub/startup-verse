/**
 * Unified Chat Roster Builder
 *
 * Combines interests, invitations, and team members into a unified
 * roster for the sidebar-based chat system.
 */

function pickAvatar(person) {
  if (!person || typeof person !== "object") return "";
  return (
    person.avatarUrl ||
    person.avatar ||
    person.profile?.avatar ||
    person.profileImage ||
    ""
  );
}

/**
 * Build chat roster for Founder view
 * Combines: talents who sent interest + talents founder invited + team members
 */
export function buildFounderChatRoster(founderId, receivedInterests, sentInvitations, teamMembers = []) {
  const byUserId = new Map();

  // Add talents who sent interest to founder's startup
  for (const interest of receivedInterests || []) {
    const talentId = String(interest.talentId?._id || interest.talentId || "");
    if (!talentId) continue;

    const existing = byUserId.get(talentId);
    const interestDate = new Date(interest.createdAt || 0);

    if (!existing || interestDate > new Date(existing.createdAt || 0)) {
      byUserId.set(talentId, {
        id: talentId,
        name: interest.talentName || interest.talentId?.name || "Talent",
        role: "talent",
        title: interest.preferredRole || interest.role || "Talent",
        location: interest.talentLocation || interest.location || "",
        avatar: pickAvatar(interest.talentId) || pickAvatar(interest),
        isOnline: false,
        status: "away",
        source: "interest",
        sourceId: interest._id || interest.id,
        startupId: interest.startupId,
        startupTitle: interest.startupTitle || "",
        createdAt: interest.createdAt,
        statusText: interest.status || "pending",
      });
    }
  }

  // Add talents founder has invited
  for (const invitation of sentInvitations || []) {
    const talentId = String(invitation.talentId?._id || invitation.talentId || "");
    if (!talentId) continue;

    const existing = byUserId.get(talentId);
    const inviteDate = new Date(invitation.createdAt || 0);

    // Only update if this is newer or doesn't exist
    if (!existing || inviteDate > new Date(existing.createdAt || 0)) {
      byUserId.set(talentId, {
        id: talentId,
        name: invitation.talentName || invitation.talentId?.name || "Talent",
        role: "talent",
        title: invitation.role || "Talent",
        location: invitation.talentLocation || invitation.location || "",
        avatar: pickAvatar(invitation.talentId) || pickAvatar(invitation),
        isOnline: false,
        status: "away",
        source: "invitation",
        sourceId: invitation._id || invitation.id,
        startupId: invitation.startupId,
        startupTitle: invitation.startupTitle || "",
        createdAt: invitation.createdAt,
        statusText: invitation.status || "pending",
      });
    }
  }

  // Add team members (they take precedence for title/avatar)
  for (const member of teamMembers || []) {
    const memberId = String(member.id || member._id || "");
    if (!memberId) continue;

    const existing = byUserId.get(memberId);
    if (existing) {
      // Update with team member info
      existing.isOnline = member.isOnline || member.online || false;
      existing.status = member.status || (existing.isOnline ? "online" : "away");
      existing.title = member.title || member.role || existing.title;
      existing.location = member.location || existing.location || "";
      existing.avatar = pickAvatar(member) || existing.avatar;
      existing.source = "team";
    } else {
      byUserId.set(memberId, {
        id: memberId,
        name: member.name || "Team Member",
        role: member.role || "team-member",
        title: member.title || member.role || "Team Member",
        location: member.location || "",
        avatar: pickAvatar(member),
        isOnline: member.isOnline || member.online || false,
        status: member.status || "away",
        source: "team",
        startupId: member.startupId,
        createdAt: member.joinedAt || member.createdAt,
      });
    }
  }

  return Array.from(byUserId.values()).sort((a, b) => {
    // Sort by most recent interaction
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Build chat roster for Talent view
 * Combines: founders talent sent interest to + founders who invited talent
 */
export function buildTalentChatRoster(talentId, sentInterests, receivedInvitations) {
  const byFounderId = new Map();

  // Add founders talent sent interest to
  for (const interest of sentInterests || []) {
    const founderId = String(interest.founderId?._id || interest.founderId || "");
    if (!founderId) continue;

    const existing = byFounderId.get(founderId);
    const interestDate = new Date(interest.createdAt || 0);

    if (!existing || interestDate > new Date(existing.createdAt || 0)) {
      byFounderId.set(founderId, {
        id: founderId,
        name: interest.founderName || interest.founderId?.name || "Founder",
        role: "founder",
        title: interest.startupTitle || "Startup Founder",
        location: interest.startupLocation || interest.location || "",
        avatar: pickAvatar(interest.founderId) || pickAvatar(interest),
        isOnline: false,
        status: "away",
        source: "interest",
        sourceId: interest._id || interest.id,
        startupId: interest.startupId,
        startupTitle: interest.startupTitle || "",
        createdAt: interest.createdAt,
        statusText: interest.status || "pending",
      });
    }
  }

  // Add founders who invited this talent
  for (const invitation of receivedInvitations || []) {
    const founderId = String(invitation.founderId?._id || invitation.founderId || "");
    if (!founderId) continue;

    const existing = byFounderId.get(founderId);
    const inviteDate = new Date(invitation.createdAt || 0);

    if (!existing || inviteDate > new Date(existing.createdAt || 0)) {
      byFounderId.set(founderId, {
        id: founderId,
        name: invitation.founderName || invitation.founderId?.name || "Founder",
        role: "founder",
        title: invitation.startupTitle || "Startup Founder",
        location: invitation.startupLocation || invitation.location || "",
        avatar: pickAvatar(invitation.founderId) || pickAvatar(invitation),
        isOnline: false,
        status: "away",
        source: "invitation",
        sourceId: invitation._id || invitation.id,
        startupId: invitation.startupId,
        startupTitle: invitation.startupTitle || "",
        createdAt: invitation.createdAt,
        statusText: invitation.status || "pending",
      });
    }
  }

  return Array.from(byFounderId.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Check if a chat connection exists between two users
 * Returns the source of the connection (interest, invitation, team) or null
 */
export function getChatConnectionSource(userId, otherUserId, roster) {
  const member = roster.find((m) => m.id === otherUserId);
  return member?.source || null;
}

/**
 * Get conversation metadata for display
 */
export function getConversationBadge(status, source) {
  if (status === "accepted" || status === "onboarded") {
    return { text: "Connected", variant: "success" };
  }
  if (status === "declined" || status === "rejected") {
    return { text: "Declined", variant: "destructive" };
  }
  if (source === "interest") {
    return { text: "Interest Sent", variant: "default" };
  }
  if (source === "invitation") {
    return { text: "Invited", variant: "secondary" };
  }
  return { text: "Pending", variant: "outline" };
}
