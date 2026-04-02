/**
 * Safely extracts initials from a name string
 * @param name - The name to extract initials from
 * @param fallback - Fallback initials if name is invalid (default: '?')
 * @returns Initials string (e.g., "JD" for "John Doe")
 */
export function getInitials(name, fallback = "?") {
  if (!name || typeof name !== "string") {
    return fallback;
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return fallback;
  }

  const nameParts = trimmedName.split(" ").filter((part) => part.length > 0);

  if (nameParts.length === 0) {
    return fallback;
  }

  if (nameParts.length === 1) {
    // Single name: take first two characters
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  // Multiple names: take first character of first and last name
  return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
}

/**
 * Safely gets the first name from a full name string
 * @param name - The full name
 * @param fallback - Fallback if name is invalid (default: 'User')
 * @returns First name
 */
export function getFirstName(name, fallback = "User") {
  if (!name || typeof name !== "string") {
    return fallback;
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return fallback;
  }

  const nameParts = trimmedName.split(" ").filter((part) => part.length > 0);
  return nameParts.length > 0 ? nameParts[0] : fallback;
}
