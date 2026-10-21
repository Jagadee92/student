import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    mobile: { type: String, required: true, trim: true, maxlength: 16 },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    department: { type: String, trim: true, maxlength: 100, default: "" },
    degree: {
      type: String,
      trim: true,
      maxlength: 120,
      default: undefined,
    },
    rollNumber: { type: String, trim: true, maxlength: 40, default: "" },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["enrolled", "completed", "withdrawn"],
      default: "enrolled",
    },
    studentId: { type: String, trim: true, maxlength: 60, default: "" },
    passingYear: { type: Number, min: 1980, max: 2100, default: null },
    profilePhotoPath: { type: String, default: "" },
    documentPath: { type: String, default: "" },
  },
  { timestamps: true },
);

studentSchema.index({ name: 1, email: 1 });
studentSchema.index({ department: 1, degree: 1, gender: 1 });
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ createdAt: -1 });

export default mongoose.model("Student", studentSchema);
