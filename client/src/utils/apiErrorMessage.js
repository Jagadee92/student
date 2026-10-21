export function getApiErrorMessage(data, status) {
  let message = data?.message || `Request failed with status ${status}.`;
  if (!Array.isArray(data?.errors) || !data.errors.length) return message;

  const validationMessages = data.errors
    .map(({ field, message: validationMessage }) =>
      field && validationMessage
        ? `${field}: ${validationMessage}`
        : validationMessage,
    )
    .filter(Boolean);

  return validationMessages.length
    ? validationMessages.join(" ")
    : message;
}
