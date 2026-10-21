import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../services/api.js";
import PageHeader from "../components/PageHeader.jsx";
import FormField from "../components/FormField.jsx";
import Loading from "../components/Loading.jsx";
import Modal from "../components/Modal.jsx";
import Notice from "../components/Notice.jsx";
import ListPagination from "../components/ListPagination.jsx";
import { paginateItems } from "../utils/pagination.js";

const EMPTY_FORM = { name: "", durationYears: "4" };

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingProgram, setEditingProgram] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pagination = paginateItems(programs, page);

  async function loadPrograms() {
    setLoading(true);
    try {
      const data = await api("/programs");
      setPrograms(data.items || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrograms();
  }, []);

  function openCreateForm() {
    setEditingProgram(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(program) {
    setEditingProgram(program);
    setForm({
      name: program.name,
      durationYears: String(program.durationYears),
    });
    setShowForm(true);
  }

  async function saveProgram(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(
        editingProgram ? `/programs/${editingProgram.id}` : "/programs",
        {
          method: editingProgram ? "PATCH" : "POST",
          body: JSON.stringify({
            name: form.name,
            durationYears: Number(form.durationYears),
          }),
        },
      );
      setShowForm(false);
      setMessage(
        editingProgram ? "Course or program updated." : "Course or program added.",
      );
      await loadPrograms();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProgram(program) {
    if (!window.confirm(`Delete ${program.name} from the course/program list?`)) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await api(`/programs/${program.id}`, { method: "DELETE" });
      setMessage(`${program.name} deleted.`);
      await loadPrograms();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="container workspace-container">
      <PageHeader
        eyebrow="ACADEMIC CATALOG"
        title="Programs"
        description="Add the academic course/program options students can choose during registration. The Courses page is for subject classes."
        action={
          <button
            type="button"
            className="button button-primary"
            onClick={openCreateForm}
          >
            <Plus size={17} /> Add program
          </button>
        }
      />
      <Notice type="success" onClose={() => setMessage("")}>
        {message}
      </Notice>
      <Notice type="error" onClose={() => setError("")}>
        {error}
      </Notice>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Available programs{" "}
              <span className="count-badge">{programs.length}</span>
            </h2>
            <p>Manage each academic program and its duration.</p>
          </div>
        </div>
        {loading ? (
          <Loading label="Loading courses and programs..." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Program name</th>
                  <th>Study duration</th>
                  <th className="actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((program) => (
                  <tr key={program.id}>
                    <td>{program.name}</td>
                    <td>
                      {program.durationYears}{" "}
                      {program.durationYears === 1 ? "year" : "years"}
                    </td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Edit ${program.name}`}
                        onClick={() => openEditForm(program)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button danger-icon"
                        aria-label={`Delete ${program.name}`}
                        onClick={() => deleteProgram(program)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!programs.length && (
                  <tr>
                    <td colSpan="3" className="empty-cell">
                      No courses or programs have been added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <ListPagination pagination={pagination} onPageChange={setPage} />
      </section>

      {showForm && (
        <Modal
          title={editingProgram ? "Edit program" : "Add program"}
          subtitle="Choose the name shown to students and set how many years they can register for."
          onClose={() => !busy && setShowForm(false)}
        >
          <form className="form-stack" onSubmit={saveProgram}>
            <FormField
              label="Program name"
              name="name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              minLength="2"
              maxLength="120"
              placeholder="Enter the academic program name"
              required
            />
            <FormField
              as="select"
              label="Duration"
              name="durationYears"
              value={form.durationYears}
              onChange={(event) =>
                setForm({ ...form, durationYears: event.target.value })
              }
              required
            >
              {Array.from({ length: 6 }, (_, index) => index + 1).map((year) => (
                <option key={year} value={year}>
                  {year} {year === 1 ? "year" : "years"}
                </option>
              ))}
            </FormField>
            <div className="form-actions">
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setShowForm(false)}
                disabled={busy}
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
                  : editingProgram
                    ? "Save changes"
                    : "Add program"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
