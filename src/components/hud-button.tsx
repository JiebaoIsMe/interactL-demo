
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

import "../styles/hud.css";

type HudButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  label?: string;
  tone?: "primary" | "warn";
};

export default function HudButton({
  icon: Icon,
  label,
  tone,
  className,
  type = "button",
  ...props
}: HudButtonProps) {
  const classes = [
    "hud-btn",
    "hud-glass",
    tone,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={type}
      className={classes}
      aria-label={props["aria-label"] ?? label}
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      {label && <span className="hud-label">{label}</span>}
    </button>
  );
}
