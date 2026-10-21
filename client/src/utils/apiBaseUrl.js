export function getApiBaseUrl(value) {
  const baseUrl = typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
  if (!baseUrl) return "/api";
  return /\/api$/i.test(baseUrl) ? baseUrl : `${baseUrl}/api`;
}
