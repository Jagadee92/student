import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ShieldCheck,
  Users,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Student records",
    text: "Create, update, search, filter, and safely manage student information.",
  },
  {
    icon: Building2,
    title: "Departments and degrees",
    text: "Organize and search student records by department, degree, and roll number.",
  },
  {
    icon: BarChart3,
    title: "Useful reports",
    text: "View actual student totals, recent enrolments, and department distribution.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    text: "Separate Admin, Staff, Student, and Viewer permissions for safer daily work.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const signedInDestination = isAdmin ? "/dashboard" : "/profile";
  const destinationLabel = isAdmin ? "Open dashboard" : "Open my profile";

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="kicker-dot" /> Student administration made clear
            </span>
            <h1>
              Spend less time managing records.{" "}
              <span>More time helping students.</span>
            </h1>
            <p className="hero-description">
              A practical Student Management System for student enrolment,
              departments, reporting, and access control.
            </p>
            <div className="hero-actions">
              {user ? (
                <>
                  <Button
                    as={Link}
                    to={signedInDestination}
                    variant="primary"
                    size="large"
                    icon={ArrowRight}
                  >
                    {destinationLabel}
                  </Button>
                  {isAdmin && (
                    <Button
                      as={Link}
                      to="/students"
                      variant="outline"
                      size="large"
                    >
                      Manage students
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    as={Link}
                    to="/register"
                    variant="primary"
                    size="large"
                    icon={ArrowRight}
                  >
                    Create account
                  </Button>
                  <Button as={Link} to="/about" variant="outline" size="large">
                    About CampusFlow
                  </Button>
                </>
              )}
            </div>
            <div className="hero-proof">
              <CheckCircle2 size={17} />
              <span>Responsive layout</span>
              <CheckCircle2 size={17} />
              <span>MongoDB-backed records</span>
            </div>
          </div>
          <div
            className="hero-visual"
            aria-label="Example student management dashboard"
          >
            <div className="visual-topline">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span>Workspace overview</span>
              <span className="live-pill">LIVE DATA</span>
            </div>
            <div className="visual-welcome">
              <div>
                <small>MONDAY, 19 OCTOBER</small>
                <h3>Good morning, Admin</h3>
                <p>Here is your campus at a glance.</p>
              </div>
              <div className="visual-avatar">AD</div>
            </div>
            <div className="visual-stats">
              <div>
                <span className="visual-stat-icon purple">
                  <Users size={17} />
                </span>
                <small>Students</small>
                <strong>Manage</strong>
                <em>Student directory</em>
              </div>
              <div>
                <span className="visual-stat-icon green">
                  <GraduationCap size={17} />
                </span>
                <small>Departments</small>
                <strong>Organize</strong>
                <em>Student directory</em>
              </div>
              <div>
                <span className="visual-stat-icon orange">
                  <BarChart3 size={17} />
                </span>
                <small>Reports</small>
                <strong>Review</strong>
                <em>Live summaries</em>
              </div>
            </div>
            <div className="visual-bottom">
              <div>
                <span className="visual-check">
                  <CheckCircle2 size={15} />
                </span>
                <div>
                  <strong>Everything in one place</strong>
                  <small>Students and departments</small>
                </div>
              </div>
              <span className="visual-arrow">
                <ArrowRight size={17} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">MADE FOR EVERYDAY WORK</p>
            <h2>One workspace. The essentials covered.</h2>
            <p>
              Keep the information you need organized, searchable, and
              permission-controlled.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon">
                  <feature.icon size={22} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container cta-panel">
          <div>
            <p className="eyebrow">READY WHEN YOU ARE</p>
            <h2>{user ? "Welcome back to CampusFlow." : "Start with a clean student register."}</h2>
            <p>
              {user
                ? "Continue to your student management workspace."
                : "Register an account or sign in to continue to your workspace."}
            </p>
          </div>
          <div className="cta-actions">
            {user ? (
              <Link to={signedInDestination} className="button button-light">
                {destinationLabel} <ArrowRight size={17} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="button button-light">
                  Create account <ArrowRight size={17} />
                </Link>
                <Link to="/login" className="button button-ghost-light">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
