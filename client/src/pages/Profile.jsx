import { useState } from "react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Notice from "../components/Notice.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Profile() {
  const { user, saveUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyPassword, setBusyPassword] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setBusyProfile(true);
    setError("");
    setProfileMessage("");
    try {
      const data = await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      saveUser(data.user);
      setProfileMessage("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusyProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError("");
    setPasswordMessage("");
    if (passwords.password !== passwords.confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setBusyPassword(true);
    try {
      const result = await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          password: passwords.password,
        }),
      });
      setPasswordMessage(result.message);
      setPasswords({ currentPassword: "", password: "", confirmPassword: "" });
    } catch (passwordError) {
      setError(passwordError.message);
    } finally {
      setBusyPassword(false);
    }
  }

  return (
    <div className="container workspace-container">
      <PageHeader
        eyebrow="ACCOUNT SETTINGS"
        title="My profile"
        description="Update your account details and keep your password secure."
      />
      <Notice type="error">{error}</Notice>
      <div className="profile-layout">
        <section className="panel profile-summary">
          <span className="profile-large-avatar">
            <UserRound size={30} />
          </span>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <StatusBadge value={user?.role} />
          <div className="profile-security-note">
            <KeyRound size={17} />
            <span>
              Your password is stored as a hash in the database, not as readable
              text.
            </span>
          </div>
        </section>
        <div className="profile-forms">
          <section className="panel profile-form-panel">
            <div className="panel-heading">
              <div>
                <h2>Personal information</h2>
                <p>These details are shown on your account.</p>
              </div>
            </div>
            <Notice type="success">{profileMessage}</Notice>
            <form className="form-stack" onSubmit={saveProfile}>
              <label className="form-field">
                <span>Full name</span>
                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile({ ...profile, name: event.target.value })
                  }
                  minLength="2"
                  maxLength="100"
                  required
                />
              </label>
              <label className="form-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={profile.email}
                  readOnly={user?.role === "student"}
                  onChange={(event) =>
                    setProfile({ ...profile, email: event.target.value })
                  }
                  required
                />
              </label>
              <button className="button button-primary" disabled={busyProfile}>
                {busyProfile ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={16} /> Save profile
                  </>
                )}
              </button>
            </form>
          </section>
          {user?.role === "student" && user.studentProfile && (
            <section className="panel profile-form-panel">
              <div className="panel-heading">
                <div>
                  <h2>Academic information</h2>
                  <p>Your verified student registration details.</p>
                </div>
              </div>
              <dl className="profile-academic-grid">
                <div><dt>College roll number</dt><dd>{user.studentProfile.rollNumber}</dd></div>
                <div><dt>Gender</dt><dd>{user.studentProfile.gender || "Not provided"}</dd></div>
                <div><dt>Program</dt><dd>{user.studentProfile.program}</dd></div>
                <div><dt>Branch / department</dt><dd>{user.studentProfile.branch}</dd></div>
                <div><dt>Year of study</dt><dd>{user.studentProfile.yearOfStudy}</dd></div>
                <div><dt>Passing-out year</dt><dd>{user.studentProfile.passingOutYear}</dd></div>
                <div><dt>Phone number</dt><dd>{user.studentProfile.phone}</dd></div>
                <div className="profile-academic-full"><dt>Address</dt><dd>{user.studentProfile.address}</dd></div>
              </dl>
            </section>
          )}
          <section className="panel profile-form-panel">
            <div className="panel-heading">
              <div>
                <h2>Change password</h2>
                <p>Choose a new password of at least 8 characters.</p>
              </div>
            </div>
            <Notice type="success">{passwordMessage}</Notice>
            <form className="form-stack" onSubmit={changePassword}>
              <label className="form-field">
                <span>Current password</span>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    setPasswords({
                      ...passwords,
                      currentPassword: event.target.value,
                    })
                  }
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="form-field">
                <span>New password</span>
                <input
                  type="password"
                  minLength="8"
                  value={passwords.password}
                  onChange={(event) =>
                    setPasswords({ ...passwords, password: event.target.value })
                  }
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="form-field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  minLength="8"
                  value={passwords.confirmPassword}
                  onChange={(event) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: event.target.value,
                    })
                  }
                  autoComplete="new-password"
                  required
                />
              </label>
              <button className="button button-primary" disabled={busyPassword}>
                {busyPassword ? "Updating..." : "Change password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
