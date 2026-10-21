import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import Notice from "../components/Notice.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await api("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email }),
      });
      setMessage(result.message);
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
        <h1>Reset your password</h1>
        <p className="auth-subtitle">
          Enter your account email. If it exists, the configured email service
          will send a reset link.
        </p>

        <Notice type="error">{error}</Notice>
        <Notice type="success">{message}</Notice>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <button className="button button-primary button-full" disabled={busy}>
            {busy ? "Sending..." : "Send reset instructions"}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </section>
  );
}
