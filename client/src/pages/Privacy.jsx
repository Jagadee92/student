export default function Privacy() {
  return (
    <section className="section">
      <div className="container narrow-container">
        <p className="eyebrow">PRIVACY POLICY</p>
        <h1 className="public-page-title">
          Handle student information responsibly.
        </h1>
        <p className="lead-text">
          This page is a starter policy outline for the Student Management
          System. The institution operating the application must review it and
          publish a policy that matches its actual processes and legal
          requirements.
        </p>
        <div className="policy-content">
          <h2>Information stored</h2>
          <p>
            The application may store student names, email addresses, mobile
            numbers, gender, address, department and degree details, uploaded photos,
            and supporting documents. User accounts store a name, email address,
            role, and a password hash.
          </p>
          <h2>How information is used</h2>
          <p>
            Information is used to maintain student records, prepare dashboard
            summaries, and send account or
            password-reset emails when email settings are configured.
          </p>
          <h2>Access and security</h2>
          <p>
            Authentication and role checks restrict access to protected API
            routes. Uploaded supporting documents are served through
            authenticated endpoints, not as public static files. These controls
            are not a substitute for a complete production security and privacy
            review.
          </p>
          <h2>Retention and deletion</h2>
          <p>
            The institution should define its retention period, backup policy,
            deletion process, and process for handling data requests. Deleting a
            student in the application removes that student's stored photo and
            document files when those files are available on local storage.
          </p>
          <h2>Contact</h2>
          <p>
            Replace this section with the institution's official privacy contact
            and the process for privacy questions.
          </p>
        </div>
      </div>
    </section>
  );
}
