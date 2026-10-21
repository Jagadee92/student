import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Notice from "../components/Notice.jsx";
import FormField from "../components/FormField.jsx";
import { getLoginPath } from "../utils/loginPath.js";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(email, password);
      const path = location.state?.from?.pathname;
      navigate(getLoginPath(user.role, path), {
        replace: true,
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="auth-icon">
          <LockKeyhole size={25} />
        </div>
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in to your account</h1>
        <p className="auth-subtitle">
          Use your account details to open your workspace.
        </p>
        <Notice type="success">{location.state?.successMessage}</Notice>
        <Notice type="error">{error}</Notice>
        <form className="form-stack" onSubmit={handleSubmit}>
          <FormField
            label="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="form-options">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <button
            type="submit"
            className="button button-primary button-full"
            disabled={busy}
          >
            {busy ? (
              "Signing in..."
            ) : (
              <>
                <LogIn size={17} /> Sign in
              </>
            )}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p className="auth-note">
          For the first Admin account, follow the setup steps in the README.
        </p>
      </div>
    </section>
  );
}
