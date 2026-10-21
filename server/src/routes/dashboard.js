import { Router } from "express";
import Student from "../models/Student.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", async (_req, res, next) => {
  try {
    const [
      totalStudents,
      recentDocuments,
      statusGroups,
      departmentGroups,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.find().sort({ createdAt: -1 }).limit(6),
      Student.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Student.aggregate([
        {
          $group: {
            _id: {
              department: {
                $cond: [
                  { $eq: [{ $ifNull: ["$department", ""] }, ""] },
                  "Unassigned department",
                  "$department",
                ],
              },
              degree: { $ifNull: ["$degree", "Unspecified degree"] },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            department: "$_id.department",
            degree: "$_id.degree",
            count: 1,
          },
        },
        { $sort: { count: -1, department: 1, degree: 1 } },
      ]),
    ]);

    const studentsByStatus = { enrolled: 0, completed: 0, withdrawn: 0 };
    for (const group of statusGroups) studentsByStatus[group._id] = group.count;

    const recentStudents = recentDocuments.map((student) => ({
      id: String(student._id),
      name: student.name,
      email: student.email,
      department: student.department || "Unassigned department",
      degree: student.degree || "Unspecified degree",
      status: student.status,
      createdAt: student.createdAt,
    }));

    res.json({
      totalStudents,
      studentsByStatus,
      departmentDistribution: departmentGroups.map((item) => ({
        department: item.department,
        degree: item.degree,
        count: item.count,
      })),
      recentStudents,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
