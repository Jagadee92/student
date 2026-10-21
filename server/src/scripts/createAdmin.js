import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

async function addAdmin() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before creating an Admin.",
    );
  }
  if (process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }
  if (process.env.ADMIN_PASSWORD.startsWith("use-a-unique-password")) {
    throw new Error(
      "Replace the sample ADMIN_PASSWORD with a unique password before creating the Admin account.",
    );
  }

  await mongoose.connect(process.env.MONGO_URI);
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(
      "An account already uses this email. No new Admin was created.",
    );
    await mongoose.disconnect();
    return;
  }

  const user = await User.create({
    name: process.env.ADMIN_NAME || "Administrator",
    email,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
    role: "admin",
  });

  console.log(`Admin account created for ${user.email}.`);
  await mongoose.disconnect();
}

addAdmin().catch(async (error) => {
  console.error("Could not create Admin:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
