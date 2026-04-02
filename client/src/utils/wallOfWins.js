/**
 * Wall of Wins Management
 * Stores and manages team wins for the Virtual Office
 */

const WINS_STORAGE_KEY = "wall_of_wins";
const MAX_WINS = 50; // Keep last 50 wins

/**
 * Get all wins
 */
export function getWins() {
  const winsJson = localStorage.getItem(WINS_STORAGE_KEY);
  if (!winsJson) return [];

  try {
    return JSON.parse(winsJson);
  } catch {
    return [];
  }
}

/**
 * Add a new win to the wall
 */
export function addWin(win) {
  const wins = getWins();

  const newWin = {
    ...win,
    id: `win-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  // Add to beginning (newest first)
  wins.unshift(newWin);

  // Keep only MAX_WINS most recent
  const trimmedWins = wins.slice(0, MAX_WINS);

  localStorage.setItem(WINS_STORAGE_KEY, JSON.stringify(trimmedWins));

  console.log("🏆 [WallOfWins] Added new win:", newWin);

  return newWin;
}

/**
 * Add a stage progression win
 */
export function addStageProgressionWin(stageName) {
  return addWin({
    icon: "🎉",
    text: `Advanced to ${stageName}!`,
    category: "stage-progression",
    userName: "System",
  });
}

/**
 * Add a milestone completion win
 */
export function addMilestoneWin(milestoneName, userName) {
  return addWin({
    icon: "🏆",
    text: `Completed: ${milestoneName}`,
    category: "milestone",
    userName,
  });
}

/**
 * Add a weekly outcome completion win
 */
export function addWeeklyOutcomeWin(outcomeName, weekNumber) {
  return addWin({
    icon: "✅",
    text: `Week ${weekNumber} Complete: ${outcomeName}`,
    category: "milestone",
    userName: "Team",
  });
}

/**
 * Add a revenue milestone win
 */
export function addRevenueWin(milestone) {
  return addWin({
    icon: "💰",
    text: milestone,
    category: "revenue",
    userName: "Finance",
  });
}

/**
 * Add a customer milestone win
 */
export function addCustomerWin(milestone) {
  return addWin({
    icon: "🎯",
    text: milestone,
    category: "customer",
    userName: "Growth",
  });
}

/**
 * Add a team milestone win
 */
export function addTeamWin(milestone, userName) {
  return addWin({
    icon: "👥",
    text: milestone,
    category: "team",
    userName,
  });
}

/**
 * Add a product launch win
 */
export function addProductWin(milestone) {
  return addWin({
    icon: "🚀",
    text: milestone,
    category: "product",
    userName: "Product",
  });
}

/**
 * Format time ago
 */
export function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "1w ago";
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  return then.toLocaleDateString();
}

/**
 * Delete a win
 */
export function deleteWin(winId) {
  const wins = getWins();
  const filtered = wins.filter((w) => w.id !== winId);
  localStorage.setItem(WINS_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Clear all wins
 */
export function clearWins() {
  localStorage.removeItem(WINS_STORAGE_KEY);
}
