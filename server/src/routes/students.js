import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import multer from "multer";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import Student from "../models/Student.js";
import Program from "../models/Program.js";
import {
  requireAuth,
  requireAdmin,
  requireStaffOrAdmin,
} from "../middleware/auth.js";
import {
  getStudentOptions,
  escapeRegex,
  isValidPhone,
} from "../utils/query.js";
import {
  photoFolder,
  documentFolder,
  createUploadFolders,
  deleteUpload,
  getSavedFilePath,
} from "../utils/files.js";
import { sendStudentRecordEmail } from "../services/emailService.js";
import { readCsv } from "../utils/readCsv.js";
import { getFileType } from "../utils/fileTypes.js";
import { escapeCsvRows } from "../utils/csvExport.js";
import { readExcel } from "../utils/readExcel.js";

const router = Router();
const commonDepartments = [
  "CSE",
  "Civil",
  "ECE",
  "EEE",
  "Mechanical",
  "Information Technology",
  "AI & ML",
  "AI & Data Science",
  "Chemical",
  "Biotechnology",
  "Agriculture",
];
const studentExportFields = [
  "name",
  "email",
  "mobile",
  "gender",
  "department",
  "degree",
  "rollNumber",
  "address",
  "status",
  "passingYear",
  "createdAt",
];
router.use(requireAuth, requireAdmin);
await createUploadFolders();

const photoExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const documentExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const photoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const documentTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

function makeUploader(folder, allowedExtensions, allowedTypes, maxFileSize) {
  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, folder),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      if (
        !allowedExtensions.has(extension) ||
        !allowedTypes.has(file.mimetype)
      ) {
        return callback(new Error("The file type is not allowed."));
      }
      callback(null, true);
    },
  });
}

const photoUpload = makeUploader(
  photoFolder,
  photoExtensions,
  photoTypes,
  2 * 1024 * 1024,
);
const documentUpload = makeUploader(
  documentFolder,
  documentExtensions,
  documentTypes,
  5 * 1024 * 1024,
);
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = new Set([".csv", ".xlsx"]);
    const allowedTypes = new Set([
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
      "text/plain",
    ]);
    if (!allowedExtensions.has(extension) || !allowedTypes.has(file.mimetype)) {
      return callback(new Error("Choose a valid CSV or XLSX file."));
    }
    callback(null, true);
  },
});

function formatStudent(student) {
  return {
    id: String(student._id),
    name: student.name,
    email: student.email,
    mobile: student.mobile,
    gender: student.gender,
    address: student.address,
    department: student.department || "",
    degree: student.degree || "",
    rollNumber: student.rollNumber || student.studentId || "",
    status: student.status,
    studentId: student.studentId || student.rollNumber || "",
    passingYear: student.passingYear ?? null,
    profilePhotoAvailable: Boolean(student.profilePhotoPath),
    documentAvailable: Boolean(student.documentPath),
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}

function checkStudent(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }

  const allowedFields = new Set([
    "name",
    "email",
    "mobile",
    "gender",
    "department",
    "degree",
    "rollNumber",
    "address",
    "status",
    "passingYear",
  ]);
  const unexpectedField = Object.keys(body).find(
    (key) => !allowedFields.has(key),
  );
  if (unexpectedField) return `Unexpected field: ${unexpectedField}.`;

  const requiredFields = [
    "name",
    "email",
    "mobile",
    "gender",
    "department",
    "degree",
    "rollNumber",
    "address",
  ];
  if (!partial) {
    const missingField = requiredFields.find(
      (field) =>
        body[field] === undefined ||
        body[field] === null ||
        String(body[field]).trim() === "",
    );
    if (missingField) return `${missingField} is required.`;
  }

  if (
    body.name !== undefined &&
    (typeof body.name !== "string" ||
      body.name.trim().length < 2 ||
      body.name.trim().length > 120)
  ) {
    return "Student name must contain 2 to 120 characters.";
  }
  if (
    body.email !== undefined &&
    (typeof body.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))
  ) {
    return "Enter a valid email address.";
  }
  if (body.mobile !== undefined && !isValidPhone(body.mobile)) {
    return "Enter a valid mobile number with 10 to 15 digits.";
  }
  if (
    body.gender !== undefined &&
    !["Male", "Female", "Other"].includes(body.gender)
  ) {
    return "Choose a valid gender.";
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
    return "Course or program name must contain 2 to 120 characters.";
  }
  if (
    body.rollNumber !== undefined &&
    (typeof body.rollNumber !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9/-]{1,39}$/.test(body.rollNumber.trim()))
  ) {
    return "Enter a valid college roll number.";
  }
  if (
    body.address !== undefined &&
    (typeof body.address !== "string" ||
      body.address.trim().length < 3 ||
      body.address.trim().length > 500)
  ) {
    return "Address must contain 3 to 500 characters.";
  }
  if (
    body.status !== undefined &&
    !["enrolled", "completed", "withdrawn"].includes(body.status)
  ) {
    return "Choose a valid enrollment status.";
  }
  if (
    body.passingYear !== undefined &&
    body.passingYear !== null &&
    body.passingYear !== ""
  ) {
    const year = Number(body.passingYear);
    if (!Number.isInteger(year) || year < 1980 || year > 2100)
      return "Passing year must be between 1980 and 2100.";
  }
  return "";
}

function uploadFile(uploadMiddleware, fieldName) {
  return (req, res, next) => {
    uploadMiddleware.single(fieldName)(req, res, (error) => {
      if (error) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? "The file is too large. Choose a smaller file."
            : error.message || "The file could not be uploaded.";
        return res.status(400).json({ message });
      }
      next();
    });
  };
}

router.get("/", async (req, res, next) => {
  try {
    const options = getStudentOptions(req.query);

    const filter = {};
    if (options.search) {
      const searchRegex = new RegExp(
        escapeRegex(options.search),
        "i",
      );
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNumber: searchRegex },
        { studentId: searchRegex },
        { department: searchRegex },
      ];
    }
    if (options.department) {
      filter.department = new RegExp(`^${escapeRegex(options.department)}$`, "i");
    }
    if (options.degree) filter.degree = options.degree;
    if (options.gender) filter.gender = options.gender;

    const [students, total, departments, programs, existingDegrees] =
      await Promise.all([
        Student.find(filter)
          .sort({ [options.sortBy]: options.sortOrder === "asc" ? 1 : -1 })
          .skip((options.page - 1) * options.limit)
          .limit(options.limit)
          .lean(),
        Student.countDocuments(filter),
        Student.distinct("department", {
          department: { $type: "string", $ne: "" },
        }),
        Program.find().select("name durationYears").sort({ name: 1 }).lean(),
        Student.distinct("degree", { degree: { $type: "string", $ne: "" } }),
      ]);

    res.json({
      items: students.map(formatStudent),
      total,
      departments: [...new Set([...commonDepartments, ...departments])].sort(
        (left, right) => left.localeCompare(right),
      ),
      degrees: [
        ...new Set([
          ...programs.map((program) => program.name),
          ...existingDegrees,
        ]),
      ].sort((left, right) => left.localeCompare(right)),
      programs: programs.map((program) => ({
        id: String(program._id),
        name: program.name,
        durationYears: program.durationYears,
      })),
      page: options.page,
      limit: options.limit,
      pages: Math.max(1, Math.ceil(total / options.limit)),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/export/file", async (req, res, next) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase();
    const ids = String(req.query.ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.some((id) => !mongoose.isValidObjectId(id))) {
      return res
        .status(400)
        .json({ message: "One or more student IDs are invalid." });
    }

    const filter = ids.length ? { _id: { $in: ids } } : {};
    const students = await Student.find(filter).sort({ name: 1 });
    if (ids.length && students.length !== new Set(ids).size) {
      return res
        .status(404)
        .json({ message: "One or more selected student IDs were not found." });
    }

    const rows = students.map((student) => {
      const item = formatStudent(student);
      return {
        name: item.name,
        email: item.email,
        mobile: item.mobile,
        gender: item.gender,
        department: item.department || "",
        degree: item.degree || "",
        rollNumber: item.rollNumber,
        address: item.address,
        status: item.status,
        passingYear: item.passingYear || "",
        createdAt: item.createdAt,
      };
    });
    const filename = `students-${new Date().toISOString().slice(0, 10)}`;

    if (format === "csv") {
      const csv = new Parser({
        fields: studentExportFields,
      }).parse(escapeCsvRows(rows));
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`,
      );
      return res.send(csv);
    }

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Students");
      worksheet.columns = studentExportFields.map((field) => ({
        header: field,
        key: field,
        width: Math.max(14, Math.min(30, field.length + 8)),
      }));
      worksheet.addRows(escapeCsvRows(rows));
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3E4DD8" },
      };
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.xlsx"`,
      );
      return res.send(buffer);
    }

    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.pdf"`,
      );
      const document = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 35,
      });
      document.pipe(res);
      document
        .fontSize(20)
        .text("Student Management Report", { align: "center" });
      document.moveDown();
      document.fontSize(10);
      rows.forEach((row, index) => {
        if (document.y > 520) document.addPage();
        document.text(
          `${index + 1}. ${row.name} | ${row.email} | ${row.mobile} | ${row.department} | ${row.degree} | ${row.status}`,
        );
        document.text(
          `   Gender: ${row.gender} | Roll no.: ${row.rollNumber || "-"} | Address: ${row.address}`,
        );
        document.moveDown(0.3);
      });
      if (!rows.length) document.text("No student records found.");
      return document.end();
    }

    return res
      .status(400)
      .json({ message: "Export format must be csv, xlsx, or pdf." });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/photo", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Student ID is invalid." });
    const student = await Student.findById(req.params.id).select(
      "profilePhotoPath",
    );
    if (!student || !student.profilePhotoPath)
      return res.status(404).json({ message: "Student photo not found." });
    const filePath = getSavedFilePath(photoFolder, student.profilePhotoPath);
    await fs.access(filePath);
    res.setHeader("Cache-Control", "private, no-store");
    res.type(path.extname(filePath));
    res.sendFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT")
      return res.status(404).json({ message: "Student photo file not found." });
    next(error);
  }
});

router.get("/:id/document", requireStaffOrAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Student ID is invalid." });
    const student = await Student.findById(req.params.id).select(
      "documentPath name",
    );
    if (!student || !student.documentPath)
      return res.status(404).json({ message: "Student document not found." });
    const filePath = getSavedFilePath(documentFolder, student.documentPath);
    await fs.access(filePath);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`,
    );
    return res.sendFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT")
      return res
        .status(404)
        .json({ message: "Student document file not found." });
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Student ID is invalid." });
    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Student not found." });
    res.json({ student: formatStudent(student) });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/import",
  requireStaffOrAdmin,
  uploadFile(memoryUpload, "file"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "Choose a CSV or XLSX file." });
      const isExcel = /\.xlsx$/i.test(req.file.originalname);
      let rows;
      if (isExcel) {
        rows = await readExcel(req.file.buffer);
        if (!rows)
          return res
            .status(400)
            .json({ message: "The Excel file has no worksheets." });
      } else {
        rows = await readCsv(req.file.buffer);
      }

      const inserted = [];
      const errors = [];
      const programKeys = new Set(
        (await Program.find().select("key").lean()).map((program) => program.key),
      );
      for (let index = 0; index < rows.length; index += 1) {
        const normalized = Object.fromEntries(
          Object.entries(rows[index]).map(([key, value]) => [
            String(key)
              .trim()
              .toLowerCase()
              .replace(/[\s_-]/g, ""),
            String(value ?? "").trim(),
          ]),
        );
        const rowData = {
          name: normalized.name,
          email: normalized.email,
          mobile: normalized.mobile || normalized.phone,
          gender: normalized.gender,
          department: normalized.department,
          degree: normalized.degree,
          rollNumber: normalized.rollnumber || normalized.studentid || "",
          address: normalized.address || "",
          status: normalized.status || "enrolled",
          passingYear: normalized.passingyear || "",
        };
        const message = checkStudent(rowData);
        if (message) {
          errors.push({ row: index + 2, reason: message });
          continue;
        }
        if (!programKeys.has(rowData.degree.trim().toLowerCase())) {
          errors.push({
            row: index + 2,
            reason: "Choose a course or program from the college catalog.",
          });
          continue;
        }
        try {
          const student = await Student.create({
            name: rowData.name.trim(),
            email: rowData.email.trim().toLowerCase(),
            mobile: String(rowData.mobile).replace(/[\s()-]/g, ""),
            gender: rowData.gender,
            department: rowData.department.trim(),
            degree: rowData.degree,
            rollNumber: rowData.rollNumber.trim().toUpperCase(),
            address: rowData.address.trim(),
            status: rowData.status,
            passingYear: rowData.passingYear
              ? Number(rowData.passingYear)
              : null,
          });
          inserted.push(String(student._id));
        } catch (error) {
          errors.push({
            row: index + 2,
            reason:
              error.code === 11000
                ? "Email is already registered."
                : "This row could not be saved.",
          });
        }
      }

      res.json({
        insertedCount: inserted.length,
        errorCount: errors.length,
        errors: errors.slice(0, 100),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/", requireStaffOrAdmin, async (req, res, next) => {
  try {
    const message = checkStudent(req.body);
    if (message) return res.status(400).json({ message });
    const programExists = await Program.exists({
      key: req.body.degree.trim().toLowerCase(),
    });
    if (!programExists) {
      return res.status(400).json({
        message: "Choose a course or program from the college catalog.",
      });
    }

    const student = await Student.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      mobile: String(req.body.mobile).replace(/[\s()-]/g, ""),
      gender: req.body.gender,
      department: req.body.department.trim(),
      degree: req.body.degree,
      rollNumber: req.body.rollNumber.trim().toUpperCase(),
      address: req.body.address.trim(),
      status: req.body.status || "enrolled",
      passingYear: req.body.passingYear ? Number(req.body.passingYear) : null,
    });

    let emailSent = false;
    if (student.status === "enrolled") {
      const emailResult = await sendStudentRecordEmail(student);
      emailSent = emailResult.sent;
    }

    res.status(201).json({
      student: formatStudent(student),
      emailNotificationSent: emailSent,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireStaffOrAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Student ID is invalid." });
    const message = checkStudent(req.body, { partial: true });
    if (message) return res.status(400).json({ message });

    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Student not found." });
    if (
      req.body.degree !== undefined &&
      req.body.degree.trim().toLowerCase() !== student.degree?.trim().toLowerCase() &&
      !(await Program.exists({ key: req.body.degree.trim().toLowerCase() }))
    ) {
      return res.status(400).json({
        message: "Choose a course or program from the college catalog.",
      });
    }

    if (req.body.name !== undefined) student.name = req.body.name.trim();
    if (req.body.email !== undefined)
      student.email = req.body.email.trim().toLowerCase();
    if (req.body.mobile !== undefined)
      student.mobile = String(req.body.mobile).replace(/[\s()-]/g, "");
    if (req.body.gender !== undefined) student.gender = req.body.gender;
    if (req.body.department !== undefined)
      student.department = req.body.department.trim();
    if (req.body.degree !== undefined) student.degree = req.body.degree;
    if (req.body.rollNumber !== undefined)
      student.rollNumber = req.body.rollNumber.trim().toUpperCase();
    if (req.body.address !== undefined)
      student.address = req.body.address.trim();
    if (req.body.status !== undefined) student.status = req.body.status;
    if (req.body.passingYear !== undefined)
      student.passingYear = req.body.passingYear
        ? Number(req.body.passingYear)
        : null;

    await student.save();
    res.json({ student: formatStudent(student) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Student ID is invalid." });
    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Student not found." });

    await student.deleteOne();
    await Promise.all([
      deleteUpload(getSavedFilePath(photoFolder, student.profilePhotoPath)),
      deleteUpload(getSavedFilePath(documentFolder, student.documentPath)),
    ]);
    res.json({ message: "Student deleted." });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/photo",
  requireStaffOrAdmin,
  uploadFile(photoUpload, "photo"),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        if (req.file) await deleteUpload(req.file.path);
        return res.status(400).json({ message: "Student ID is invalid." });
      }
      if (!req.file)
        return res.status(400).json({ message: "Choose a photo first." });
      const detectedType = getFileType(await fs.readFile(req.file.path));
      if (detectedType !== req.file.mimetype) {
        await deleteUpload(req.file.path);
        return res
          .status(400)
          .json({ message: "The photo content does not match its file type." });
      }

      const student = await Student.findById(req.params.id);
      if (!student) {
        await deleteUpload(req.file.path);
        return res.status(404).json({ message: "Student not found." });
      }

      const oldPath = getSavedFilePath(photoFolder, student.profilePhotoPath);
      student.profilePhotoPath = path.basename(req.file.path);
      await student.save();
      await deleteUpload(oldPath);
      res.json({ student: formatStudent(student) });
    } catch (error) {
      if (req.file) await deleteUpload(req.file.path);
      next(error);
    }
  },
);

router.post(
  "/:id/document",
  requireStaffOrAdmin,
  uploadFile(documentUpload, "document"),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        if (req.file) await deleteUpload(req.file.path);
        return res.status(400).json({ message: "Student ID is invalid." });
      }
      if (!req.file)
        return res.status(400).json({ message: "Choose a document first." });
      const detectedType = getFileType(await fs.readFile(req.file.path));
      if (detectedType !== req.file.mimetype) {
        await deleteUpload(req.file.path);
        return res.status(400).json({
          message: "The document content does not match its file type.",
        });
      }

      const student = await Student.findById(req.params.id);
      if (!student) {
        await deleteUpload(req.file.path);
        return res.status(404).json({ message: "Student not found." });
      }

      const oldPath = getSavedFilePath(documentFolder, student.documentPath);
      student.documentPath = path.basename(req.file.path);
      await student.save();
      await deleteUpload(oldPath);
      res.json({ student: formatStudent(student) });
    } catch (error) {
      if (req.file) await deleteUpload(req.file.path);
      next(error);
    }
  },
);

router.delete("/:id/photo", requireStaffOrAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Student ID is invalid." });
    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Student not found." });
    const oldPath = getSavedFilePath(photoFolder, student.profilePhotoPath);
    student.profilePhotoPath = "";
    await student.save();
    await deleteUpload(oldPath);
    res.json({ message: "Student photo removed." });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/document", requireStaffOrAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Student ID is invalid." });
    const student = await Student.findById(req.params.id);
    if (!student)
      return res.status(404).json({ message: "Student not found." });
    const oldPath = getSavedFilePath(documentFolder, student.documentPath);
    student.documentPath = "";
    await student.save();
    await deleteUpload(oldPath);
    res.json({ message: "Student document removed." });
  } catch (error) {
    next(error);
  }
});

export default router;
