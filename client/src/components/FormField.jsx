export default function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  hint = "",
  as = "input",
  children,
  ...props
}) {
  const Element = as;
  return (
    <label className="form-field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <Element
        name={name}
        value={value}
        onChange={onChange}
        type={as === "input" ? type : undefined}
        required={required}
        {...props}
      >
        {children}
      </Element>
      {hint && <small>{hint}</small>}
    </label>
  );
}
