import { useEffect, useRef, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { api, downloadFile } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Notice from "../components/Notice.jsx";
import Loading from "../components/Loading.jsx";
import Modal from "../components/Modal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const EMPTY_FORM = {
  name: "",
  email: "",
  mobile: "",
  gender: "",
  department: "",
  degree: "",
  rollNumber: "",
  address: "",
  status: "enrolled",
  passingYear: "",
};

function getFormFromStudent(student) {
  return {
    name: student.name || "",
    email: student.email || "",
    mobile: student.mobile || "",
    gender: student.gender || "",
    department: student.department || "",
    degree: student.degree || "",
    rollNumber: student.rollNumber || student.studentId || "",
    address: student.address || "",
    status: student.status || "enrolled",
    passingYear: student.passingYear || "",
  };
}

function cleanDownloadName(name) {
  return (
    String(name || "student")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "student"
  );
}

export default function Students() {
  const { user } = useAuth();
  const canEdit = ["admin", "staff"].includes(user?.role);
  const isAdmin = user?.role === "admin";

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [degree, setDegree] = useState("");
  const [gender, setGender] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detailsStudent, setDetailsStudent] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    if (!downloadMenuOpen) return undefined;

    function closeOnOutsideClick(event) {
      if (!downloadMenuRef.current?.contains(event.target)) {
        setDownloadMenuOpen(false);
      }
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setDownloadMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [downloadMenuOpen]);

  useEffect(() => {
    return () => {
      if (photoPreview?.url) URL.revokeObjectURL(photoPreview.url);
    };
  }, [photoPreview]);

  useEffect(() => {
    let active = true;
    async function loadStudents() {
      setLoading(true);
      setError("");
      const parameters = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
      });
      if (department) parameters.set("department", department);
      if (degree) parameters.set("degree", degree);
      if (gender) parameters.set("gender", gender);

      try {
        const data = await api(`/students?${parameters.toString()}`);
        if (active) {
          setStudents(data.items || []);
          setDepartments(data.departments || []);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStudents();
    return () => {
      active = false;
    };
  }, [
    page,
    limit,
    search,
    department,
    degree,
    gender,
    sortBy,
    sortOrder,
    refreshKey,
  ]);

  function showMessage(text) {
    setMessage(text);
    setError("");
  }

  function showError(text) {
    setError(text);
    setMessage("");
  }

  function openCreateForm() {
    setEditingStudent(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(student) {
    setEditingStudent(student);
    setForm(getFormFromStudent(student));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingStudent(null);
    setForm(EMPTY_FORM);
  }

  function handleFormChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function saveStudent(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = { ...form, passingYear: form.passingYear || null };
      const url = editingStudent
        ? `/students/${editingStudent.id}`
        : "/students";
      const data = await api(url, {
        method: editingStudent ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      closeForm();
      if (data.emailNotificationSent === false && !editingStudent) {
        showMessage(
          "Student record saved. Configure SMTP settings to send student notification emails.",
        );
      } else {
        showMessage(
          editingStudent
            ? "Student details updated."
            : "Student record created.",
        );
      }
      setPage(1);
      const params = new URLSearchParams({
        page: "1",
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
      });
      if (department) params.set("department", department);
      if (degree) params.set("degree", degree);
      if (gender) params.set("gender", gender);
      const refreshed = await api(`/students?${params.toString()}`);
      setStudents(refreshed.items || []);
      setDepartments(refreshed.departments || []);
      setTotal(refreshed.total || 0);
      setPages(refreshed.pages || 1);
    } catch (saveError) {
      showError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteStudent(student) {
    if (
      !window.confirm(
        `Delete ${student.name}? This also removes their uploaded photo and document.`,
      )
    )
      return;
    setError("");
    setMessage("");
    try {
      await api(`/students/${student.id}`, { method: "DELETE" });
      showMessage("Student record deleted.");
      setStudents((current) =>
        current.filter((item) => item.id !== student.id),
      );
      setSelectedIds((current) =>
        current.filter((id) => id !== student.id),
      );
      setTotal((current) => Math.max(0, current - 1));
      if (students.length === 1 && page > 1) setPage((current) => current - 1);
    } catch (deleteError) {
      showError(deleteError.message);
    }
  }

  async function uploadStudentFile(event, student, kind) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append(kind === "photo" ? "photo" : "document", file);
    setError("");
    setMessage("");
    try {
      await api(`/students/${student.id}/${kind}`, {
        method: "POST",
        body: formData,
      });
      showMessage(
        kind === "photo"
          ? "Student photo uploaded."
          : "Supporting document uploaded.",
      );
      setRefreshKey((current) => current + 1);
    } catch (uploadError) {
      showError(uploadError.message);
    } finally {
      event.target.value = "";
    }
  }

  async function openStudentFile(student, kind) {
    try {
      const blob = await api(`/students/${student.id}/${kind}`);
      if (kind === "photo") {
        setPhotoPreview({ url: URL.createObjectURL(blob), name: student.name });
      } else {
        const extensionsByType = {
          "application/pdf": ".pdf",
          "image/jpeg": ".jpg",
          "image/png": ".png",
        };
        const extension = extensionsByType[blob.type] || "";
        downloadFile(
          blob,
          `${cleanDownloadName(student.name)}-document${extension}`,
        );
      }
    } catch (fileError) {
      showError(fileError.message);
    }
  }

  async function openStudentDetails(student) {
    try {
      const data = await api(`/students/${student.id}`);
      setDetailsStudent(data.student);
    } catch (detailError) {
      showError(detailError.message);
    }
  }

  async function removeStudentFile(student, kind) {
    const label = kind === "photo" ? "photo" : "document";
    if (!window.confirm(`Remove ${student.name}'s ${label}?`)) return;
    try {
      await api(`/students/${student.id}/${kind}`, { method: "DELETE" });
      showMessage(`Student ${label} removed.`);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sortBy,
        sortOrder,
      });
      if (department) params.set("department", department);
      if (degree) params.set("degree", degree);
      if (gender) params.set("gender", gender);
      const data = await api(`/students?${params.toString()}`);
      setStudents(data.items || []);
      setDepartments(data.departments || []);
    } catch (fileError) {
      showError(fileError.message);
    }
  }

  async function exportStudents(format, ids = selectedIds, filenameBase = "") {
    try {
      const params = new URLSearchParams({ format });
      if (ids.length) params.set("ids", ids.join(","));
      const blob = await api(`/students/export/file?${params.toString()}`);
      const extension = format === "xlsx" ? "xlsx" : format;
      const scope =
        filenameBase || (ids.length ? "selected-students" : "students");
      downloadFile(blob, `${scope}.${extension}`);
      setDownloadMenuOpen(false);
    } catch (exportError) {
      showError(exportError.message);
    }
  }

  function toggleStudentSelection(studentId) {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function togglePageSelection() {
    const pageIds = students.map((student) => student.id);
    const allSelected =
      pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !pageIds.includes(id))
        : [...new Set([...current, ...pageIds])],
    );
  }

  async function importStudents(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setImporting(true);
    try {
      const data = await api("/students/import", {
        method: "POST",
        body: formData,
      });
      showMessage(
        `Import finished: ${data.insertedCount} imported, ${data.errorCount} skipped.`,
      );
      if (data.errors?.length)
        showError(
          `Import finished with ${data.errorCount} row error(s). First issue: row ${data.errors[0].row}: ${data.errors[0].reason}`,
        );
      setPage(1);
      setSelectedIds([]);
      setRefreshKey((current) => current + 1);
    } catch (importError) {
      showError(importError.message);
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  function clearFilters() {
    setSearch("");
    setDepartment("");
    setDegree("");
    setGender("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  }

  return (
    <div className="container workspace-container">
      <PageHeader
        eyebrow="STUDENT DIRECTORY"
        title="Students"
        description="Search and manage college student profiles by department and degree."
        action={
          <div className="header-action-group">
            <div className="download-control" ref={downloadMenuRef}>
              <button
                type="button"
                className="button button-download"
                aria-expanded={downloadMenuOpen}
                aria-haspopup="menu"
                onClick={() => setDownloadMenuOpen((open) => !open)}
              >
                <Download size={18} />
                Download records
                <span className="download-selection-count">
                  {selectedIds.length || "All"}
                </span>
              </button>
              <div
                className={`download-menu fade${downloadMenuOpen ? " show" : ""}`}
                role="menu"
                aria-label="Choose student download format"
                aria-hidden={!downloadMenuOpen}
              >
                <p className="download-menu-heading">
                  {selectedIds.length
                    ? `Download ${selectedIds.length} selected ${
                        selectedIds.length === 1 ? "student" : "students"
                      }`
                    : "Download all students"}
                </p>
                <button
                  type="button"
                  className="download-option download-option-csv"
                  role="menuitem"
                  tabIndex={downloadMenuOpen ? 0 : -1}
                  onClick={() => exportStudents("csv")}
                >
                  <Download size={18} />
                  <span>
                    <strong>Download CSV</strong>
                    <small>Comma-separated data</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="download-option download-option-excel"
                  role="menuitem"
                  tabIndex={downloadMenuOpen ? 0 : -1}
                  onClick={() => exportStudents("xlsx")}
                >
                  <FileSpreadsheet size={18} />
                  <span>
                    <strong>Download Excel</strong>
                    <small>Editable workbook</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="download-option download-option-pdf"
                  role="menuitem"
                  tabIndex={downloadMenuOpen ? 0 : -1}
                  onClick={() => exportStudents("pdf")}
                >
                  <FileText size={18} />
                  <span>
                    <strong>Download PDF</strong>
                    <small>Printable student report</small>
                  </span>
                </button>
              </div>
            </div>
            {canEdit && (
              <button
                type="button"
                className="button button-primary"
                onClick={openCreateForm}
              >
                <Plus size={17} /> Add student
              </button>
            )}
          </div>
        }
      />
      <Notice type="success" onClose={() => setMessage("")}>
        {message}
      </Notice>
      <Notice type="error" onClose={() => setError("")}>
        {error}
      </Notice>

      <section className="panel filter-panel">
        <div className="filter-heading">
          <div>
            <Filter size={18} />
            <strong>Find students</strong>
          </div>
          <button type="button" className="text-button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
        <div className="filter-grid">
          <label className="search-field">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, roll number, or department"
              aria-label="Search name, email, roll number, or department"
            />
          </label>
          <label className="form-field compact-field">
            <span>Department</span>
            <select
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All departments</option>
              {departments.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field compact-field">
            <span>Degree</span>
            <select
              value={degree}
              onChange={(event) => {
                setDegree(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All degrees</option>
              <option value="B.Tech">B.Tech</option>
              <option value="M.Tech">M.Tech</option>
              <option value="Degree">Degree</option>
              <option value="Pharmacy">Pharmacy</option>
            </select>
          </label>
          <label className="form-field compact-field">
            <span>Gender</span>
            <select
              value={gender}
              onChange={(event) => {
                setGender(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All genders</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <label className="form-field compact-field">
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setPage(1);
              }}
            >
              <option value="createdAt">Date added</option>
              <option value="name">Name</option>
            </select>
          </label>
          <label className="form-field compact-field">
            <span>Order</span>
            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setPage(1);
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
        {canEdit && (
          <div className="import-toolbar import-toolbar-students">
            <label className="button button-quiet button-small upload-button">
              <Upload size={15} />{" "}
              {importing ? "Importing..." : "Import students"}
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={importStudents}
                disabled={importing}
              />
            </label>
            <span>
              Import student records with department, degree, and college roll
              number from CSV or Excel. PDF is available for reports.
            </span>
          </div>
        )}
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>
              All students <span className="count-badge">{total}</span>
            </h2>
            <p>
              {selectedIds.length
                ? `${selectedIds.length} selected across pages. Choose Download records above to save only these students.`
                : "Use a row checkbox to download one or more students, or leave all rows unselected to download everyone."}
            </p>
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="text-button selection-clear"
                onClick={() => setSelectedIds([])}
              >
                Clear selection
              </button>
            )}
          </div>
          <label className="page-size-control">
            <span>Rows</span>
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        {loading ? (
          <Loading label="Loading students..." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="select-column">
                      <input
                        type="checkbox"
                        aria-label="Select all students on this page"
                        checked={
                          students.length > 0 &&
                          students.every((student) =>
                            selectedIds.includes(student.id),
                          )
                        }
                        onChange={togglePageSelection}
                        disabled={!students.length}
                      />
                    </th>
                    <th>Student</th>
                    <th>Mobile</th>
                    <th>Department / degree</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Files</th>
                    <th className="actions-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="select-column">
                        <input
                          type="checkbox"
                          aria-label={`Select ${student.name}`}
                          checked={selectedIds.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                        />
                      </td>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar">
                            {student.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              className="student-name-button"
                              onClick={() => openStudentDetails(student)}
                            >
                              {student.name}
                            </button>
                            <small>{student.email}</small>
                            {student.rollNumber && (
                              <small>Roll no. {student.rollNumber}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{student.mobile}</td>
                      <td>
                        {student.department || "-"}
                        <small className="table-subtext">
                          {student.degree || ""}
                        </small>
                      </td>
                      <td>{student.gender}</td>
                      <td>
                        <StatusBadge value={student.status} />
                      </td>
                      <td>
                        <div className="file-pills">
                          {student.profilePhotoAvailable && (
                            <button
                              type="button"
                              className="file-pill"
                              onClick={() => openStudentFile(student, "photo")}
                              title="View photo"
                            >
                              <UserRound size={13} /> Photo
                            </button>
                          )}
                          {student.documentAvailable && (
                            <button
                              type="button"
                              className="file-pill"
                              onClick={() =>
                                openStudentFile(student, "document")
                              }
                              title="Download private document"
                            >
                              <FileText size={13} /> Doc
                            </button>
                          )}
                          {!student.profilePhotoAvailable &&
                            !student.documentAvailable && (
                              <span className="muted">None</span>
                            )}
                        </div>
                      </td>
                      <td>
                        <div className="row-action-group">
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`View ${student.name}`}
                            title="View details"
                            onClick={() => openStudentDetails(student)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button download-row-button"
                            aria-label={`Download ${student.name} as PDF`}
                            title={`Download ${student.name} as PDF`}
                            onClick={() =>
                              exportStudents(
                                "pdf",
                                [student.id],
                                cleanDownloadName(student.name),
                              )
                            }
                          >
                            <Download size={16} />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                className="icon-button"
                                aria-label={`Edit ${student.name}`}
                                title="Edit student"
                                onClick={() => openEditForm(student)}
                              >
                                <Pencil size={16} />
                              </button>
                              <label
                                className="icon-button file-icon-button"
                                title="Upload photo"
                                aria-label={`Upload photo for ${student.name}`}
                              >
                                <UserRound size={16} />
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(event) =>
                                    uploadStudentFile(event, student, "photo")
                                  }
                                />
                              </label>
                              <label
                                className="icon-button file-icon-button"
                                title="Upload document"
                                aria-label={`Upload document for ${student.name}`}
                              >
                                <FileText size={16} />
                                <input
                                  type="file"
                                  accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                                  onChange={(event) =>
                                    uploadStudentFile(
                                      event,
                                      student,
                                      "document",
                                    )
                                  }
                                />
                              </label>
                              {student.profilePhotoAvailable && (
                                <button
                                  type="button"
                                  className="icon-button"
                                  title="Remove photo"
                                  aria-label={`Remove photo for ${student.name}`}
                                  onClick={() =>
                                    removeStudentFile(student, "photo")
                                  }
                                >
                                  <X size={15} />
                                </button>
                              )}
                              {student.documentAvailable && (
                                <button
                                  type="button"
                                  className="icon-button"
                                  title="Remove document"
                                  aria-label={`Remove document for ${student.name}`}
                                  onClick={() =>
                                    removeStudentFile(student, "document")
                                  }
                                >
                                  <X size={15} />
                                </button>
                              )}
                            </>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              className="icon-button danger-icon"
                              title="Delete student"
                              aria-label={`Delete ${student.name}`}
                              onClick={() => deleteStudent(student)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!students.length && (
                    <tr>
                      <td colSpan="8">
                        <div className="empty-inline">
                          <Users size={26} />
                          <strong>No matching students</strong>
                          <span>
                            Try changing the filters or add a new student.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Showing {students.length ? (page - 1) * limit + 1 : 0}–
                {Math.min(page * limit, total)} of {total}
              </span>
              <div>
                <button
                  type="button"
                  className="button button-outline button-small"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </button>
                <span className="page-counter">
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  className="button button-outline button-small"
                  disabled={page >= pages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {showForm && (
        <Modal
          title={editingStudent ? "Edit student" : "Add student"}
          subtitle="Fields are checked in the browser and validated again by the API."
          onClose={closeForm}
          wide
        >
          <form onSubmit={saveStudent} className="modal-form">
            <div className="form-grid">
              <label className="form-field">
                <span>Full name *</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  minLength="2"
                  maxLength="120"
                  autoComplete="name"
                  required
                />
              </label>
              <label className="form-field">
                <span>Email address *</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="form-field">
                <span>Mobile number *</span>
                <input
                  name="mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={handleFormChange}
                  pattern="\+?[0-9\s()-]{10,20}"
                  title="Enter a mobile number containing 10 to 15 digits."
                  required
                />
              </label>
              <label className="form-field">
                <span>Gender *</span>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="form-field">
                <span>Department *</span>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                  list="student-departments"
                  maxLength="100"
                  placeholder="e.g. Computer Science and Engineering"
                  required
                />
                <datalist id="student-departments">
                  {departments.map((item) => (
                    <option value={item} key={item} />
                  ))}
                </datalist>
              </label>
              <label className="form-field">
                <span>Degree *</span>
                <select
                  name="degree"
                  value={form.degree}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select degree</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="Degree">Degree</option>
                  <option value="Pharmacy">Pharmacy</option>
                </select>
              </label>
              <label className="form-field">
                <span>College roll number *</span>
                <input
                  name="rollNumber"
                  value={form.rollNumber}
                  onChange={handleFormChange}
                  maxLength="40"
                  pattern="[A-Za-z0-9][A-Za-z0-9/-]{1,39}"
                  title="Use letters, numbers, hyphens, or slashes."
                  required
                />
              </label>
              <label className="form-field">
                <span>Enrolment status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  <option value="enrolled">Enrolled</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </label>
              <label className="form-field">
                <span>Passing year (optional)</span>
                <input
                  name="passingYear"
                  type="number"
                  min="1980"
                  max="2100"
                  value={form.passingYear}
                  onChange={handleFormChange}
                />
              </label>
              <label className="form-field form-field-full">
                <span>Address *</span>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  minLength="3"
                  maxLength="500"
                  rows="3"
                  required
                />
              </label>
            </div>
            {editingStudent && (
              <p className="form-help">
                Upload or remove the photo and supporting document from the
                student's row after saving.
              </p>
            )}
            <div className="modal-footer">
              <button
                type="button"
                className="button button-outline"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={busy}
              >
                {busy
                  ? "Saving..."
                  : editingStudent
                    ? "Save changes"
                    : "Add student"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detailsStudent && (
        <Modal
          title={detailsStudent.name}
          subtitle="Student information"
          onClose={() => setDetailsStudent(null)}
        >
          <div className="detail-list">
            <div>
              <span>Email</span>
              <strong>{detailsStudent.email}</strong>
            </div>
            <div>
              <span>Mobile</span>
              <strong>{detailsStudent.mobile}</strong>
            </div>
            <div>
              <span>Gender</span>
              <strong>{detailsStudent.gender}</strong>
            </div>
            <div>
              <span>Department</span>
              <strong>{detailsStudent.department || "-"}</strong>
            </div>
            <div>
              <span>Degree</span>
              <strong>{detailsStudent.degree || "-"}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>
                <StatusBadge value={detailsStudent.status} />
              </strong>
            </div>
            <div>
              <span>College roll number</span>
              <strong>{detailsStudent.rollNumber || "-"}</strong>
            </div>
            <div>
              <span>Passing year</span>
              <strong>{detailsStudent.passingYear || "-"}</strong>
            </div>
            <div className="detail-full">
              <span>Address</span>
              <strong>{detailsStudent.address || "-"}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>
                {detailsStudent.createdAt
                  ? new Date(detailsStudent.createdAt).toLocaleString()
                  : "-"}
              </strong>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="button button-outline"
              type="button"
              onClick={() => setDetailsStudent(null)}
            >
              Close
            </button>
            {canEdit && (
              <button
                className="button button-primary"
                type="button"
                onClick={() => {
                  openEditForm(detailsStudent);
                  setDetailsStudent(null);
                }}
              >
                Edit student
              </button>
            )}
          </div>
        </Modal>
      )}

      {photoPreview && (
        <Modal
          title={`${photoPreview.name} — profile photo`}
          subtitle="Private student photo preview"
          onClose={() => setPhotoPreview(null)}
        >
          <div className="photo-preview-wrap">
            <img
              className="photo-preview-image"
              src={photoPreview.url}
              alt={`${photoPreview.name} profile`}
            />
          </div>
          <div className="modal-footer">
            <button
              className="button button-outline"
              type="button"
              onClick={() => setPhotoPreview(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
