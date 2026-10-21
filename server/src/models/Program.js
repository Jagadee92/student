import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    key: { type: String, required: true, unique: true, trim: true },
    durationYears: { type: Number, required: true, min: 1, max: 6 },
  },
  { timestamps: true },
);

export default mongoose.model("Program", programSchema);
