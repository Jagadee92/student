const LABELS = {
  enrolled: "Enrolled",
  completed: "Completed",
  withdrawn: "Withdrawn",
  active: "Active",
  inactive: "Inactive",
  admin: "Admin",
  staff: "Staff",
  student: "Student",
  viewer: "Viewer",
};

export default function StatusBadge({ value }) {
  const text = LABELS[value] || value || "-";
  return (
    <span
      className={`status-badge status-${String(value || "unknown").toLowerCase()}`}
    >
      {text}
    </span>
  );
}
