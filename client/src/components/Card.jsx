export default function Card({
  title,
  description,
  action,
  className = "",
  children,
}) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || description || action) && (
        <div className="panel-heading">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
