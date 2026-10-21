export function getLoginPath(role, path) {
  if (["student", "viewer"].includes(role)) return "/profile";
  if (role !== "admin") return "/profile";
  return path || "/dashboard";
}
