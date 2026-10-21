import { getApiBaseUrl } from "../utils/apiBaseUrl.js";

const API_BASE_URL = getApiBaseUrl(import.meta.env.VITE_API_URL);

export async function api(path, options = {}) {
  const { auth = true, headers: customHeaders = {}, ...fetchOptions } = options;
  const headers = { Accept: "application/json", ...customHeaders };
  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  if (fetchOptions.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = auth ? sessionStorage.getItem("token") : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot reach the API server at ${API_BASE_URL}. Make sure the backend is running and the frontend API URL is correct.`,
      );
    }
    throw error;
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json")
    ? response.json()
    : response.blob();
}

export function downloadFile(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function openFile(blob) {
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}
