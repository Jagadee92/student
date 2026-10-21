import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, UserRoundPlus } from "lucide-react";
import { api } from "../services/api.js";
import Modal from "../components/Modal.jsx";
import Notice from "../components/Notice.jsx";
import {
  commonBranches,
  getEstimatedPassingOutYear,
  studyPrograms,
} from "../utils/academicOptions.js";
import {
  getPasswordChecks,
  isStrongPassword,
} from "../utils/passwordValidation.js";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  rollNumber: "",
  gender: "",
  phone: "",
  address: "",
  program: "",
  branch: "",
  yearOfStudy: "",
  passingOutYear: "",
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [registration, setRegistration] = useState(null);
  const navigate = useNavigate();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "program"
        ? { yearOfStudy: "", passingOutYear: "" }
        : name === "yearOfStudy"
          ? {
              passingOutYear: getEstimatedPassingOutYear(
                value,
                selectedProgram?.durationYears,
              ),
            }
          : {}),
    }));
  }

  const selectedProgram = studyPrograms.find(
    (program) => program.name === form.program,
  );
  const passwordChecks = getPasswordChecks(password);
  const passwordIsStrong = isStrongPassword(password);
  const passwordsMatch = Boolean(confirmPassword) && password === confirmPassword;

  function handleDetailsSubmit(event) {
    event.preventDefault();
    setError("");
    setStep(2);
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!passwordIsStrong) {
      setError(
        "Use 8 to 100 characters with uppercase and lowercase letters, a number, and a special character.",
      );
      return;
    }

    setBusy(true);
    try {
      const result = await api("/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ ...form, password }),
      });
      setRegistration(result);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  function goToLogin() {
    navigate("/login", {
      replace: true,
      state: { successMessage: "Your student account is ready. Sign in to continue." },
    });
  }

  return (
    <section className="auth-section">
      <div className="auth-card registration-card">
        <div className="auth-icon">
          <UserRoundPlus size={25} />
        </div>
        <p className="eyebrow">CREATE AN ACCOUNT</p>
        <h1>Student registration</h1>
        <p className="auth-subtitle">
          Create a student account. Student records are visible to Admins only.
        </p>
        <ol className="registration-steps" aria-label="Registration steps">
          {["Details", "Password"].map((label, index) => (
            <li className={step === index + 1 ? "step-active" : step > index + 1 ? "step-complete" : ""} key={label}>
              <span>{step > index + 1 ? "✓" : index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <Notice type="error" onClose={() => setError("")}>{error}</Notice>

        {step === 1 && (
          <form className="form-stack" onSubmit={handleDetailsSubmit}>
            <div className="form-grid registration-grid">
              <label className="form-field">
                <span>First name</span>
                <input name="firstName" value={form.firstName} onChange={updateField} autoComplete="given-name" maxLength="60" required />
              </label>
              <label className="form-field">
                <span>Last name</span>
                <input name="lastName" value={form.lastName} onChange={updateField} autoComplete="family-name" maxLength="60" required />
              </label>
              <label className="form-field">
                <span>Email address</span>
                <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
              </label>
              <label className="form-field">
                <span>College roll number</span>
                <input name="rollNumber" value={form.rollNumber || ""} onChange={updateField} autoComplete="off" maxLength="40" required />
                <small>Use the roll number issued by your college.</small>
              </label>
              <label className="form-field">
                <span>Gender</span>
                <select name="gender" value={form.gender} onChange={updateField} required>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="form-field">
                <span>Phone number</span>
                <input name="phone" type="tel" value={form.phone} onChange={updateField} autoComplete="tel" minLength="10" maxLength="20" required />
              </label>
              <label className="form-field form-field-full">
                <span>Current address</span>
                <textarea name="address" value={form.address || ""} onChange={updateField} autoComplete="street-address" minLength="5" maxLength="300" rows="3" required />
              </label>
              <label className="form-field">
                <span>Course of study</span>
                <select name="program" value={form.program} onChange={updateField} required>
                  <option value="">Choose course of study</option>
                  {studyPrograms.map((program) => (
                    <option key={program.name} value={program.name}>
                      {program.name}
                    </option>
                  ))}
                </select>
                <small>Select your current course of study.</small>
              </label>
              <label className="form-field">
                <span>Branch / department</span>
                <input
                  name="branch"
                  value={form.branch}
                  onChange={updateField}
                  placeholder="Choose or enter a branch"
                  list="registration-branches"
                  maxLength="80"
                  required
                />
                <datalist id="registration-branches">
                  {commonBranches.map((branch) => (
                    <option value={branch} key={branch} />
                  ))}
                </datalist>
              </label>
              <label className="form-field">
                <span>Year of study</span>
                <select name="yearOfStudy" value={form.yearOfStudy} onChange={updateField} required>
                  <option value="">Choose year</option>
                  {Array.from(
                    { length: selectedProgram?.durationYears || 6 },
                    (_, index) => index + 1,
                  ).map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <small>
                  {selectedProgram
                    ? `Choose your current year in ${selectedProgram.name}.`
                    : "Choose a course to see its study-year range."}
                </small>
              </label>
              <label className="form-field">
                <span>Passing-out year</span>
                <input
                  name="passingOutYear"
                  type="number"
                  min={new Date().getFullYear()}
                  max="2100"
                  value={form.passingOutYear}
                  onChange={updateField}
                  placeholder="Choose course and year first"
                  required
                />
                <small>
                  Estimated from your course duration and current year of study.
                  You can adjust it if needed.
                </small>
              </label>
            </div>
            <button type="submit" className="button button-primary button-full" disabled={busy}>
              <>Continue <ChevronRight size={17} /></>
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="form-stack" onSubmit={handlePasswordSubmit}>
            <p className="registration-step-note">Create a password for {form.email}.</p>
            <label className="form-field">
              <span>Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" maxLength="100" autoComplete="new-password" aria-describedby="password-requirements" required />
              <small id="password-requirements">Password must include all of the following:</small>
              <ul className="password-requirements">
                {[
                  ["length", "8 to 100 characters"],
                  ["uppercase", "An uppercase letter"],
                  ["lowercase", "A lowercase letter"],
                  ["number", "A number"],
                  ["special", "A special character"],
                ].map(([check, label]) => (
                  <li
                    className={passwordChecks[check] ? "password-check-valid" : ""}
                    key={check}
                  >
                    <span aria-hidden="true">{passwordChecks[check] ? "✓" : "○"}</span>
                    {label}
                  </li>
                ))}
              </ul>
              {password && (
                <small className={passwordIsStrong ? "password-status-valid" : "password-status-invalid"}>
                  {passwordIsStrong ? "Strong password." : "Password is not strong enough yet."}
                </small>
              )}
            </label>
            <label className="form-field">
              <span>Confirm password</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" maxLength="100" autoComplete="new-password" aria-describedby="password-match-status" required />
              {confirmPassword && (
                <small
                  id="password-match-status"
                  className={passwordsMatch ? "password-status-valid" : "password-status-invalid"}
                  role="status"
                >
                  {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                </small>
              )}
            </label>
            <div className="registration-actions">
              <button type="button" className="button button-quiet" onClick={() => setStep(1)} disabled={busy}><ChevronLeft size={16} /> Back</button>
              <button type="submit" className="button button-primary" disabled={busy || !passwordIsStrong || !passwordsMatch}>{busy ? "Creating account..." : "Submit"}</button>
            </div>
          </form>
        )}

        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
      {registration && (
        <Modal title="Account created successfully" subtitle="Your student registration is complete." onClose={goToLogin}>
          <div className="registration-success">
            <CheckCircle2 size={42} />
            <p>Your student details have been saved. Sign in to continue to your profile.</p>
            {registration.emailNotificationSent ? (
              <Notice type="success">
                The account-created email was sent to {form.email}.
              </Notice>
            ) : (
              <Notice type="info">
                Your account was created, but the confirmation email could not be sent. Please contact the administrator.
              </Notice>
            )}
            <div className="modal-footer">
              <button type="button" className="button button-primary" onClick={goToLogin}>Go to sign in</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
