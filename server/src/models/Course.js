import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    department: { type: String, required: true, trim: true, maxlength: 100 },
    degree: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    credits: { type: Number, required: true, min: 1, max: 30 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
  },
  { timestamps: true },
);

courseSchema.index({ department: 1, degree: 1 });
courseSchema.index({ instructor: 1 });

export default mongoose.model("Course", courseSchema);
