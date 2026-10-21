import mongoose from "mongoose";

const instructorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    department: { type: String, required: true, trim: true, maxlength: 100 },
    designation: { type: String, required: true, trim: true, maxlength: 80 },
    specialization: { type: String, trim: true, maxlength: 120, default: "" },
  },
  { timestamps: true },
);

instructorSchema.index({ name: 1, department: 1 });

export default mongoose.model("Instructor", instructorSchema);
