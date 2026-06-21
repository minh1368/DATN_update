export const authStorage = window.sessionStorage;

export function normalizeRoleValue(value) {
  return String(value || "customer").trim().toLowerCase();
}
