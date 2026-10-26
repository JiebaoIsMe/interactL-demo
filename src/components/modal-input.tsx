import type { InputHTMLAttributes } from "react";

type ModalInputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Visible label. If omitted, pass aria-label for accessibility. */
  label?: string;
};

export default function ModalInput({
  label,
  className = "",
  ...inputProps
}: ModalInputProps) {
  const input = (
    <input className={`modal-input ${className}`.trim()} {...inputProps} />
  );

  if (!label) {
    return input;
  }

  return (
    <label className="modal-field">
      <span className="modal-field-label">{label}</span>
      {input}
    </label>
  );
}
