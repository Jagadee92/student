import { useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import FormField from "../components/FormField.jsx";
import Loading from "../components/Loading.jsx";
import Modal from "../components/Modal.jsx";
import Notice from "../components/Notice.jsx";

const EMPTY_FORM = {
  code: "",
  name: "",
  department: "",
  degree: "B.Tech",
  credits: "3",
  description: "",
  instructorId: "",
};

export default function Courses() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const parameters = new URLSearchParams();
      if (search.trim()) parameters.set("search", search.trim());
      const [courseData, instructorData] = await Promise.all([
        api(`/courses?${parameters.toString()}`),
        api("/instructors"),
      ]);
      setCourses(courseData.items || []);
      setInstructors(instructorData.items || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [search]);

  function openCreateForm() {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(course) {
    setEditingCourse(course);
    setForm({
      code: course.code,
      name: course.name,
      department: course.department,
      degree: course.degree,
      credits: String(course.credits),
      description: course.description || "",
      instructorId: course.instructor?.id || "",
    });
    setShowForm(true);
  }

  async function saveCourse(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        credits: Number(form.credits),
        instructorId: form.instructorId || null,
      };
      await api(editingCourse ? `/courses/${editingCourse.id}` : "/courses", {
        method: editingCourse ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setShowForm(false);
      setMessage(editingCourse ? "Course updated." : "Course created.");
      await loadData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Delete ${course.code} — ${course.name}?`)) return;
    setError("");
    setMessage("");
    try {
      await api(`/courses/${course.id}`, { method: "DELETE" });
      setMessage("Course deleted.");
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="container workspace-container">
      <PageHeader
        eyebrow="ACADEMIC CATALOG"
        title="Courses"
        description={
          isAdmin
            ? "Manage courses offered by each department and assign instructors."
            : "Browse the current course catalog offered by the college."
        }
        action={
          isAdmin ? (
            <button
              type="button"
              className="button button-primary"
              onClick={openCreateForm}
            >
              <Plus size={17} /> Add course
            </button>
          ) : null
        }
      />

      {isAdmin && (
        <Notice type="success" onClose={() => setMessage("")}>
          {message}
        </Notice>
      )}
      <Notice type="error" onClose={() => setError("")}>
        {error}
      </Notice>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Course catalog <span className="count-badge">{courses.length}</span>
            </h2>
            <p>Course code, academic program, credits, and assigned instructor.</p>
          </div>
          <input
            type="search"
            aria-label="Search courses"
            placeholder="Search by course, code, or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <Loading label="Loading courses..." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Department / degree</th>
                  <th>Credits</th>
                  <th>Instructor</th>
                  <th>{isAdmin ? "Actions" : "Access"}</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="student-academic-cell">
                        <strong>{course.code} · {course.name}</strong>
                        {course.description && <small>{course.description}</small>}
                      </div>
                    </td>
                    <td>{course.department} · {course.degree}</td>
                    <td>{course.credits}</td>
                    <td>{course.instructor?.name || "Unassigned"}</td>
                    {isAdmin ? (
                      <td>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Edit ${course.code}`}
                          onClick={() => openEditForm(course)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger-icon"
                          aria-label={`Delete ${course.code}`}
                          onClick={() => deleteCourse(course)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    ) : (
                      <td>View only</td>
                    )}
                  </tr>
                ))}
                {!courses.length && (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-inline">
                        <BookOpen size={26} />
                        <strong>No courses found</strong>
                        <span>
                          {isAdmin
                            ? "Add a course to begin building the catalog."
                            : "Courses added by the college will appear here."}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <Modal
          title={editingCourse ? "Edit course" : "Add course"}
          subtitle="Provide the academic details for this course."
          onClose={() => !busy && setShowForm(false)}
          wide
        >
          <form className="form-stack" onSubmit={saveCourse}>
            <div className="form-grid">
              <FormField
                label="Course code"
                name="code"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                required
              />
              <FormField
                label="Course name"
                name="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
              <FormField
                label="Department"
                name="department"
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
                required
              />
              <FormField
                as="select"
                label="Degree"
                name="degree"
                value={form.degree}
                onChange={(event) => setForm({ ...form, degree: event.target.value })}
                required
              >
                {["B.Tech", "M.Tech", "Degree", "Pharmacy"].map((degree) => (
                  <option key={degree} value={degree}>{degree}</option>
                ))}
              </FormField>
              <FormField
                label="Credits"
                name="credits"
                type="number"
                min="1"
                max="30"
                value={form.credits}
                onChange={(event) => setForm({ ...form, credits: event.target.value })}
                required
              />
              <FormField
                as="select"
                label="Instructor"
                name="instructorId"
                value={form.instructorId}
                onChange={(event) => setForm({ ...form, instructorId: event.target.value })}
              >
                <option value="">Unassigned</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} · {instructor.department}
                  </option>
                ))}
              </FormField>
              <FormField
                as="textarea"
                label="Description"
                name="description"
                rows="3"
                maxLength="1000"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setShowForm(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary" disabled={busy}>
                {busy ? "Saving..." : editingCourse ? "Save changes" : "Create course"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
