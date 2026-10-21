import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import Notice from "../components/Notice.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("The reset link does not contain a token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await api("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ token, password }),
      });
      setMessage(result.message);
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Choose a new password</h1>
        <p className="auth-subtitle">Reset links are valid for one hour.</p>
        <Notice type="error">{error}</Notice>
        <Notice type="success">{message}</Notice>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>New password</span>
            <input
              type="password"
              minLength="8"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Confirm new password</span>
            <input
              type="password"
              minLength="8"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          <button className="button button-primary button-full" disabled={busy}>
            {busy ? "Saving..." : "Reset password"}
          </button>
        </form>
        <p className="auth-switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </section>
  );
}
