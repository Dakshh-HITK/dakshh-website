export const USER_ROLES = ["participant", "volunteer", "admin", "super_admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const SUPER_ADMIN_EMAIL = "dakshhtechteam@gmail.com";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeRoles(roles: unknown, email: string): UserRole[] {
  const input = Array.isArray(roles) ? roles : [];
  const valid = input.filter((role): role is UserRole =>
    USER_ROLES.includes(role as UserRole)
  );

  const normalized = new Set<UserRole>(valid.length > 0 ? valid : ["participant"]);

  if (normalizeEmail(email) === SUPER_ADMIN_EMAIL) {
    normalized.add("super_admin");
  }

  const hasElevatedRole =
    normalized.has("volunteer") ||
    normalized.has("admin") ||
    normalized.has("super_admin");

  if (hasElevatedRole) {
    normalized.delete("participant");
  } else {
    normalized.add("participant");
  }

  return USER_ROLES.filter((role) => normalized.has(role));
}
