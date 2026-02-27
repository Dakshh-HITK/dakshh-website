export const ADMIN_ROLES = ["admin", "crewmate", "imposter", "camsguy"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const IMPOSTER_PERMISSIONS = [
  "registrations",
  "checkin",
  "events",
  "users",
] as const;
export type ImposterPermission = (typeof IMPOSTER_PERMISSIONS)[number];
