import mongoose from "mongoose";

const pendingRegistrationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    rollNumber: { type: String, required: true, trim: true, maxlength: 40 },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    program: {
      type: String,
      required: true,
      enum: ["B.Tech", "M.Tech", "Degree", "Pharmacy"],
    },
    branch: { type: String, required: true, trim: true, maxlength: 80 },
    yearOfStudy: { type: Number, required: true, min: 1, max: 6 },
    passingOutYear: { type: Number, required: true, min: 1980, max: 2100 },
    passwordHash: { type: String, default: "", select: false },
    otpHash: { type: String, default: "", select: false },
    otpExpiresAt: { type: Date, default: null },
    otpSentAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0, min: 0, max: 5 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingRegistration", pendingRegistrationSchema);