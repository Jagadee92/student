import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpenCheck, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout} = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const publicLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
  ];
  const appLinks = [];
  if (user?.role === "admin")
    appLinks.push({ to: "/dashboard", label: "Dashboard" });
  if (user?.role === "admin")
    appLinks.push({ to: "/students", label: "Students" });
  if (user?.role === "admin") appLinks.push({ to: "/users", label: "Users" });
  if (user) appLinks.push({ to: "/courses", label: "Courses" });
  if (user) appLinks.push({ to: "/instructors", label: "Instructors" });
  if (user) appLinks.push({ to: "/profile", label: "My profile" });

  async function handleSignOut() {
    await logout();
    setMenuOpen(false);
    navigate("/", { replace: true });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="container nav-container">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark">
            <BookOpenCheck size={22} />
          </span>
          <span>
            <strong>CampusFlow</strong>
            <small>Student management</small>
          </span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav
          className={`main-nav ${menuOpen ? "main-nav-open" : ""}`}
          aria-label="Main navigation"
        >
          <div className="nav-links">
            {publicLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                end={link.to === "/"}
              >
                {link.label}
              </NavLink>
            ))}
            {appLinks.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={closeMenu}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/privacy" onClick={closeMenu}>
              Privacy
            </NavLink>
          </div>
          <div className="nav-actions">
            {user ? (
              <>
                <span className="nav-user">
                  {user.name}
                  <small>{user.role}</small>
                </span>
                <button
                  type="button"
                  className="button button-quiet button-small"
                  onClick={handleSignOut}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="button button-quiet button-small"
                  onClick={closeMenu}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="button button-primary button-small"
                  onClick={closeMenu}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
