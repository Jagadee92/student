import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDb } from "./config/database.js";

async function startServer() {
  const mongoDnsServers = process.env.MONGO_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (mongoDnsServers?.length) {
    dns.setServers(mongoDnsServers);
  }

  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.startsWith("replace-with-")
  ) {
    throw new Error(
      "JWT_SECRET must be a unique random secret with at least 32 characters. Replace the sample value in server/.env.",
    );
  }

  await connectDb();
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
  });

  server.on("error", async (error) => {
    const message =
      error.code === "EADDRINUSE"
        ? `Port ${port} is already in use. Stop the existing backend process or set a different PORT in server/.env.`
        : error.message;

    console.error("Could not start API listener:", message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error(
        "Could not close MongoDB after API startup failure:",
        disconnectError.message,
      );
    }
    process.exit(1);
  });

  async function shutDown() {
    console.log("Shutting down server...");
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutDown);
  process.on("SIGTERM", shutDown);
}

startServer().catch((error) => {
  console.error("Could not start the API:", error.message);
  process.exit(1);
});
