export function getPasswordChecks(password) {
  return {
    length: password.length >= 8 && password.length <= 100,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password) {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}
