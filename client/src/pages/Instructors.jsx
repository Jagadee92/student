import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import FormField from "../components/FormField.jsx";
import Loading from "../components/Loading.jsx";
import Modal from "../components/Modal.jsx";
import Notice from "../components/Notice.jsx";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  specialization: "",
};

export default function Instructors() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadInstructors() {
    setLoading(true);
    try {
      const parameters = new URLSearchParams();
      if (search.trim()) parameters.set("search", search.trim());
      const data = await api(`/instructors?${parameters.toString()}`);
      setInstructors(data.items || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstructors();
  }, [search]);

  function openCreateForm() {
    setEditingInstructor(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(instructor) {
    setEditingInstructor(instructor);
    setForm({
      name: instructor.name,
      email: instructor.email,
      phone: instructor.phone || "",
      department: instructor.department,
      designation: instructor.designation,
      specialization: instructor.specialization || "",
    });
    setShowForm(true);
  }

  async function saveInstructor(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(
        editingInstructor ? `/instructors/${editingInstructor.id}` : "/instructors",
        {
          method: editingInstructor ? "PATCH" : "POST",
          body: JSON.stringify(form),
        },
      );
      setShowForm(false);
      setMessage(editingInstructor ? "Instructor updated." : "Instructor created.");
      await loadInstructors();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteInstructor(instructor) {
    if (!window.confirm(`Delete instructor ${instructor.name}?`)) return;
    setError("");
    setMessage("");
    try {
      await api(`/instructors/${instructor.id}`, { method: "DELETE" });
      setMessage("Instructor deleted.");
      await loadInstructors();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="container workspace-container">
      <PageHeader
        eyebrow="ACADEMIC CATALOG"
        title="Instructors"
        description={
          isAdmin
            ? "Manage faculty details and the departments they support."
            : "Review faculty and the departments they support."
        }
        action={
          isAdmin ? (
            <button
              type="button"
              className="button button-primary"
              onClick={openCreateForm}
            >
              <Plus size={17} /> Add instructor
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
              Faculty directory{" "}
              <span className="count-badge">{instructors.length}</span>
            </h2>
            <p>Instructor contact and academic specialization details.</p>
          </div>
          <input
            type="search"
            aria-label="Search instructors"
            placeholder="Search by name, email, department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <Loading label="Loading instructors..." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Instructor</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Specialization</th>
                  <th>{isAdmin ? "Actions" : "Access"}</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((instructor) => (
                  <tr key={instructor.id}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">
                          {instructor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{instructor.name}</strong>
                          <small>{instructor.email}</small>
                          {instructor.phone && <small>{instructor.phone}</small>}
                        </div>
                      </div>
                    </td>
                    <td>{instructor.department}</td>
                    <td>{instructor.designation}</td>
                    <td>{instructor.specialization || "—"}</td>
                    {isAdmin ? (
                      <td>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Edit ${instructor.name}`}
                          onClick={() => openEditForm(instructor)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger-icon"
                          aria-label={`Delete ${instructor.name}`}
                          onClick={() => deleteInstructor(instructor)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    ) : (
                      <td>View only</td>
                    )}
                  </tr>
                ))}
                {!instructors.length && (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-inline">
                        <UserRound size={26} />
                        <strong>No instructors found</strong>
                        <span>
                          {isAdmin
                            ? "Add an instructor to assign them to courses."
                            : "Instructors added by the college will appear here."}
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
          title={editingInstructor ? "Edit instructor" : "Add instructor"}
          subtitle="Enter the instructor's academic and contact details."
          onClose={() => !busy && setShowForm(false)}
          wide
        >
          <form className="form-stack" onSubmit={saveInstructor}>
            <div className="form-grid">
              <FormField
                label="Full name"
                name="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
              <FormField
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
              <FormField
                label="Phone number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
              <FormField
                label="Department"
                name="department"
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
                required
              />
              <FormField
                label="Designation"
                name="designation"
                placeholder="Professor, Lecturer, Assistant Professor"
                value={form.designation}
                onChange={(event) => setForm({ ...form, designation: event.target.value })}
                required
              />
              <FormField
                label="Specialization"
                name="specialization"
                value={form.specialization}
                onChange={(event) => setForm({ ...form, specialization: event.target.value })}
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
                {busy
                  ? "Saving..."
                  : editingInstructor
                    ? "Save changes"
                    : "Create instructor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
