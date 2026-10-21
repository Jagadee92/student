import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container empty-page">
        <span className="empty-page-icon">
          <SearchX size={34} />
        </span>
        <p className="eyebrow">404 ERROR</p>
        <h1>That page could not be found.</h1>
        <p>The address may be incorrect, or the page may have moved.</p>
        <Link to="/" className="button button-primary">
          Return home
        </Link>
      </div>
    </section>
  );
}
