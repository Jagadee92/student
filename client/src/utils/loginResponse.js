export function getLoginUser(data) {
  if (
    !data ||
    typeof data.token !== "string" ||
    !data.token ||
    !data.user ||
    typeof data.user.role !== "string"
  ) {
    throw new Error(
      "The sign-in service returned an unexpected response. Check that VITE_API_URL points to the backend API.",
    );
  }

  return data.user;
}
