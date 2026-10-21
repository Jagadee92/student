export function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 100 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
