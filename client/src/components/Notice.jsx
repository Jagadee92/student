export default function Notice({ type = "info", children, onClose }) {
  if (!children) return null;
  return (
    <div
      className={`notice notice-${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          className="notice-close"
          aria-label="Close message"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
}
