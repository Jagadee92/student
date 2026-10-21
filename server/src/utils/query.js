const PAGE_SIZES = [10, 25, 50];
const ALLOWED_SORT_FIELDS = ["name", "createdAt"];
const ALLOWED_GENDERS = ["Male", "Female", "Other"];

export function getStudentOptions(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  if (!Number.isInteger(page) || page < 1) {
    const error = new Error("Page must be a positive whole number.");
    error.status = 400;
    throw error;
  }

  if (!PAGE_SIZES.includes(limit)) {
    const error = new Error("Page size must be 10, 25, or 50.");
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
    const error = new Error("Sort field must be name or createdAt.");
    error.status = 400;
    throw error;
  }

  if (!["asc", "desc"].includes(sortOrder)) {
    const error = new Error("Sort order must be asc or desc.");
    error.status = 400;
    throw error;
  }

  const gender = query.gender ? String(query.gender) : "";
  if (gender && !ALLOWED_GENDERS.includes(gender)) {
    const error = new Error("Gender filter is invalid.");
    error.status = 400;
    throw error;
  }

  const degree = query.degree ? String(query.degree) : "";
  if (degree && !["B.Tech", "M.Tech", "Degree", "Pharmacy"].includes(degree)) {
    const error = new Error("Degree filter is invalid.");
    error.status = 400;
    throw error;
  }

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    search: String(query.search || "")
      .trim()
      .slice(0, 100),
    department: String(query.department || "")
      .trim()
      .slice(0, 100),
    degree,
    gender,
  };
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isValidPhone(value) {
  const mobile = String(value || "").replace(/[\s()-]/g, "");
  return /^\+?[0-9]{10,15}$/.test(mobile);
}

export function isValidRole(role) {
  return ["admin", "staff", "student", "viewer"].includes(role);
}
