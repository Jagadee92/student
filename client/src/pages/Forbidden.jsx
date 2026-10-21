import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <section className="section">
      <div className="container empty-page">
        <span className="empty-page-icon">
          <ShieldAlert size={34} />
        </span>
        <p className="eyebrow">ACCESS RESTRICTED</p>
        <h1>You do not have permission to view this page.</h1>
        <p>Ask an Admin if your role needs to be changed.</p>
        <Link to="/students" className="button button-primary">
          Go to students
        </Link>
      </div>
    </section>
  );
}
