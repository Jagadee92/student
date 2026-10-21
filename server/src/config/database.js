import mongoose from "mongoose";

export function getDbError(error) {
  const servers = error.reason?.servers;
  if (!servers || typeof servers[Symbol.iterator] !== "function") return "";

  return Array.from(servers, ([address, server]) => {
    const cause = server.error;
    if (!cause) return `${address}: no connection details available`;
    const message = String(cause.message || cause.name || "connection failed")
      .split(/\r?\n/, 1)[0]
      .trim();
    return `${address}: ${message}`;
  }).join("; ");
}

export async function connectDb() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to server/.env.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    const details = getDbError(error);
    throw new Error(
      [
        "MongoDB connection failed. Verify the Atlas IP access list, database username and password, and that this network permits outbound TLS connections to MongoDB.",
        details ? `Connection details: ${details}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
  console.log("Connected to MongoDB.");
}
