import { HeartHandshake, Target, Eye } from "lucide-react";

export default function About() {
  return (
    <section className="section">
      <div className="container narrow-container">
        <p className="eyebrow">ABOUT US</p>
        <h1 className="public-page-title">
          Clearer student information, better day-to-day work.
        </h1>
        <p className="lead-text">
          CampusFlow is a learning project that demonstrates how a Student
          Management System can organize student records by branch or
          department and by course or program through a single responsive
          interface.
        </p>
        <div className="values-grid">
          <article className="value-card">
            <Target size={23} />
            <h3>Our focus</h3>
            <p>
              Make common administration tasks understandable and
              straightforward.
            </p>
          </article>
          <article className="value-card">
            <Eye size={23} />
            <h3>Our approach</h3>
            <p>
              Show clear feedback, validate information, and keep records
              connected.
            </p>
          </article>
          <article className="value-card">
            <HeartHandshake size={23} />
            <h3>Our principle</h3>
            <p>
              Respect personal information and give users only the access they
              need.
            </p>
          </article>
        </div>
        <div className="info-callout">
          <strong>Built as a MERN stack project</strong>
          <p>
            The frontend uses React and Vite. The API uses Node.js, Express, and
            Mongoose to work with MongoDB.
          </p>
        </div>
      </div>
    </section>
  );
}
