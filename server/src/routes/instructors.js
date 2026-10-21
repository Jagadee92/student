import { Router } from "express";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Instructor from "../models/Instructor.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { escapeRegex, isValidPhone } from "../utils/query.js";

const router = Router();
router.use(requireAuth);

const fields = new Set([
  "name",
  "email",
  "phone",
  "department",
  "designation",
  "specialization",
]);

function validateInstructor(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }
  const unexpected = Object.keys(body).find((field) => !fields.has(field));
  if (unexpected) return `Unexpected field: ${unexpected}.`;

  if (!partial) {
    for (const field of ["name", "email", "department", "designation"]) {
      if (body[field] === undefined || String(body[field]).trim() === "") {
        return `${field} is required.`;
      }
    }
  }
  if (
    body.name !== undefined &&
    (typeof body.name !== "string" ||
      body.name.trim().length < 2 ||
      body.name.trim().length > 100)
  ) {
    return "Instructor name must contain 2 to 100 characters.";
  }
  if (
    body.email !== undefined &&
    (typeof body.email !== "string" ||
      body.email.length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))
  ) {
    return "Enter a valid instructor email address.";
  }
  if (
    body.phone !== undefined &&
    body.phone !== "" &&
    !isValidPhone(body.phone)
  ) {
    return "Enter a valid phone number with 10 to 15 digits.";
  }
  if (
    body.department !== undefined &&
    (typeof body.department !== "string" ||
      body.department.trim().length < 2 ||
      body.department.trim().length > 100)
  ) {
    return "Department must contain 2 to 100 characters.";
  }
  if (
    body.designation !== undefined &&
    (typeof body.designation !== "string" ||
      body.designation.trim().length < 2 ||
      body.designation.trim().length > 80)
  ) {
    return "Designation must contain 2 to 80 characters.";
  }
  if (
    body.specialization !== undefined &&
    (typeof body.specialization !== "string" ||
      body.specialization.trim().length > 120)
  ) {
    return "Specialization must be 120 characters or fewer.";
  }
  return "";
}

function formatInstructor(instructor) {
  return {
    id: String(instructor._id),
    name: instructor.name,
    email: instructor.email,
    phone: instructor.phone || "",
    department: instructor.department,
    designation: instructor.designation,
    specialization: instructor.specialization || "",
    createdAt: instructor.createdAt,
    updatedAt: instructor.updatedAt,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = search
      ? {
          $or: [
            { name: new RegExp(escapeRegex(search), "i") },
            { email: new RegExp(escapeRegex(search), "i") },
            { department: new RegExp(escapeRegex(search), "i") },
            { specialization: new RegExp(escapeRegex(search), "i") },
          ],
        }
      : {};
    const instructors = await Instructor.find(filter).sort({ name: 1 }).lean();
    res.json({ items: instructors.map(formatInstructor) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Instructor ID is invalid." });
    }
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found." });
    }
    res.json({ instructor: formatInstructor(instructor) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const message = validateInstructor(req.body);
    if (message) return res.status(400).json({ message });

    const instructor = await Instructor.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      phone: String(req.body.phone || "").trim(),
      department: req.body.department.trim(),
      designation: req.body.designation.trim(),
      specialization: String(req.body.specialization || "").trim(),
    });
    res.status(201).json({ instructor: formatInstructor(instructor) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Instructor ID is invalid." });
    }
    const message = validateInstructor(req.body, true);
    if (message) return res.status(400).json({ message });

    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found." });
    }
    for (const field of fields) {
      if (req.body[field] === undefined) continue;
      const value =
        typeof req.body[field] === "string" ? req.body[field].trim() : "";
      instructor[field] = field === "email" ? value.toLowerCase() : value;
    }
    await instructor.save();
    res.json({ instructor: formatInstructor(instructor) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Instructor ID is invalid." });
    }
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found." });
    }
    if (await Course.exists({ instructor: instructor._id })) {
      return res.status(409).json({
        message: "Reassign or remove this instructor from courses before deleting.",
      });
    }
    await instructor.deleteOne();
    res.json({ message: "Instructor deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;
