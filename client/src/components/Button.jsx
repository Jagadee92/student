export default function Button({
  children,
  variant = "primary",
  size = "normal",
  icon: Icon,
  className = "",
  as: Element = "button",
  ...props
}) {
  const sizeClass =
    size === "small" ? "button-small" : size === "large" ? "button-large" : "";
  return (
    <Element
      className={`button button-${variant} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </Element>
  );
}
