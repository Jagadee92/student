export function notFound(req, res) {
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, _req, res, _next) {
  const databaseUnavailable = [
    "MongoNetworkError",
    "MongoServerSelectionError",
    "MongooseServerSelectionError",
  ].includes(error.name);

  if (databaseUnavailable) {
    console.error("Database request failed:", error.message);
    return res.status(503).json({
      message: "The database is temporarily unavailable. Please try again.",
    });
  }

  console.error(error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Please check the submitted information.",
      errors: Object.values(error.errors).map((item) => item.message),
    });
  }

  if (error.name === "CastError") {
    return res
      .status(400)
      .json({ message: "One of the supplied IDs is invalid." });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "value";
    return res
      .status(409)
      .json({ message: `That ${field} is already in use.` });
  }

  if (error.name === "MulterError") {
    return res
      .status(400)
      .json({ message: "The uploaded file is invalid or too large." });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const message =
    status < 500 ? error.message : "Something went wrong. Please try again.";
  return res.status(status).json({ message });
}
