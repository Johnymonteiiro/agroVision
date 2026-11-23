type IconProps = {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
};

export function Icon({ name, size = 24, fill = false, className = "" }: IconProps) {
  return (
    <span
      aria-hidden
      data-icon={name}
      className={`material-symbols-rounded ${fill ? "icon-fill" : ""} ${className}`}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}
