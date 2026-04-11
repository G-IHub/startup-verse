export function sanitizeUser(userDoc) {
  if (!userDoc) {
    return null;
  }

  const user =
    typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };

  delete user.hashedPassword;
  delete user.password;
  delete user.__v;

  return user;
}

export function sanitizeMany(items = []) {
  return items.map((item) => sanitizeUser(item));
}