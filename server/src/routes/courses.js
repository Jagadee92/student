import { Router } from "express";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Instructor from "../models/Instructor.js";
import Program from "../models/Program.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { escapeRegex } from "../utils/query.js";

const router = Router();
router.use(requireAuth);

const fields = new Set([
  "code",
  "name",
  "department",
  "degree",
  "credits",
  "description",
  "instructorId",
]);

function validateCourse(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }
  const unexpected = Object.keys(body).find((field) => !fields.has(field));
  if (unexpected) return `Unexpected field: ${unexpected}.`;

  if (!partial) {
    for (const field of ["code", "name", "department", "degree", "credits"]) {
      if (body[field] === undefined || String(body[field]).trim() === "") {
        return `${field} is required.`;
      }
    }
  }
  if (
    body.code !== undefined &&
    (typeof body.code !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{1,19}$/.test(body.code.trim()))
  ) {
    return "Course code must be 2 to 20 letters, numbers, hyphens, or underscores.";
  }
  if (
    body.name !== undefined &&
    (typeof body.name !== "string" ||
      body.name.trim().length < 2 ||
      body.name.trim().length > 120)
  ) {
    return "Course name must contain 2 to 120 characters.";
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
    body.degree !== undefined &&
    (typeof body.degree !== "string" ||
      body.degree.trim().length < 2 ||
      body.degree.trim().length > 120)
  ) {
    return "Choose a course or program name containing 2 to 120 characters.";
  }
  if (
    body.credits !== undefined &&
    (!Number.isInteger(Number(body.credits)) ||
      Number(body.credits) < 1 ||
      Number(body.credits) > 30)
  ) {
    return "Course credits must be a whole number from 1 to 30.";
  }
  if (
    body.description !== undefined &&
    (typeof body.description !== "string" || body.description.length > 1000)
  ) {
    return "Course description must be 1000 characters or fewer.";
  }
  if (
    body.instructorId !== undefined &&
    body.instructorId !== null &&
    body.instructorId !== "" &&
    !mongoose.isValidObjectId(body.instructorId)
  ) {
    return "Instructor ID is invalid.";
  }
  return "";
}

function formatCourse(course) {
  return {
    id: String(course._id),
    code: course.code,
    name: course.name,
    department: course.department,
    degree: course.degree,
    credits: course.credits,
    description: course.description || "",
    instructor: course.instructor
      ? {
          id: String(course.instructor._id),
          name: course.instructor.name,
          email: course.instructor.email,
          department: course.instructor.department,
        }
      : null,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function getCourseFilter(query) {
  const filter = {};
  const search = String(query.search || "").trim();
  if (search) {
    const expression = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { code: expression },
      { name: expression },
      { department: expression },
    ];
  }
  if (query.department) {
    filter.department = new RegExp(
      `^${escapeRegex(String(query.department))}$`,
      "i",
    );
  }
  if (query.degree) filter.degree = String(query.degree);
  if (query.instructorId) {
    if (!mongoose.isValidObjectId(query.instructorId)) {
      return { error: "Instructor ID is invalid." };
    }
    filter.instructor = query.instructorId;
  }
  return { filter };
}

router.get("/", async (req, res, next) => {
  try {
    const { filter, error } = getCourseFilter(req.query);
    if (error) return res.status(400).json({ message: error });
    const courses = await Course.find(filter)
      .populate("instructor", "name email department")
      .sort({ code: 1 })
      .lean();
    res.json({ items: courses.map(formatCourse) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Course ID is invalid." });
    }
    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "name email department",
    );
    if (!course) return res.status(404).json({ message: "Course not found." });
    res.json({ course: formatCourse(course) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const message = validateCourse(req.body);
    if (message) return res.status(400).json({ message });
    if (
      !(await Program.exists({ key: req.body.degree.trim().toLowerCase() }))
    ) {
      return res.status(400).json({
        message: "Choose a course or program from the college catalog.",
      });
    }
    const instructorId = req.body.instructorId || null;
    if (instructorId && !(await Instructor.exists({ _id: instructorId }))) {
      return res.status(404).json({ message: "Instructor not found." });
    }

    const course = await Course.create({
      code: req.body.code.trim().toUpperCase(),
      name: req.body.name.trim(),
      department: req.body.department.trim(),
      degree: req.body.degree,
      credits: Number(req.body.credits),
      description: String(req.body.description || "").trim(),
      instructor: instructorId,
    });
    await course.populate("instructor", "name email department");
    res.status(201).json({ course: formatCourse(course) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Course ID is invalid." });
    }
    const message = validateCourse(req.body, true);
    if (message) return res.status(400).json({ message });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });
    if (
      req.body.degree !== undefined &&
      req.body.degree.trim().toLowerCase() !== course.degree.toLowerCase() &&
      !(await Program.exists({ key: req.body.degree.trim().toLowerCase() }))
    ) {
      return res.status(400).json({
        message: "Choose a course or program from the college catalog.",
      });
    }
    if (req.body.instructorId !== undefined) {
      const instructorId = req.body.instructorId || null;
      if (instructorId && !(await Instructor.exists({ _id: instructorId }))) {
        return res.status(404).json({ message: "Instructor not found." });
      }
      course.instructor = instructorId;
    }
    for (const field of ["code", "name", "department", "degree", "credits", "description"]) {
      if (req.body[field] === undefined) continue;
      const value = req.body[field];
      course[field] =
        field === "code"
          ? value.trim().toUpperCase()
          : field === "credits"
            ? Number(value)
            : typeof value === "string"
              ? value.trim()
              : value;
    }
    await course.save();
    await course.populate("instructor", "name email department");
    res.json({ course: formatCourse(course) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Course ID is invalid." });
    }
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found." });
    await course.deleteOne();
    res.json({ message: "Course deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;
