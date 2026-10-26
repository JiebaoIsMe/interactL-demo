import type { InputHTMLAttributes } from "react";

type ModalCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "checked"
> & {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function ModalCheckbox({
  label,
  checked,
  onChange,
  className = "",
  ...inputProps
}: ModalCheckboxProps) {
  return (
    <label className={`modal-checkbox ${className}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        {...inputProps}
      />
      <span>{label}</span>
    </label>
  );
}
