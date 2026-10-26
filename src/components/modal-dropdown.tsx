export type ModalDropdownOption<T extends string = string> = {
  value: T;
  label: string;
};

type ModalDropdownProps<T extends string = string> = {
  /** Plain strings (value = label) or { value, label } pairs. */
  options: readonly (T | ModalDropdownOption<T>)[];
  value: T;
  onChange: (value: T) => void;
  /** Visible label. If omitted, pass ariaLabel for accessibility. */
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
};

export default function ModalDropdown<T extends string = string>({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  disabled,
  className = "",
}: ModalDropdownProps<T>) {
  const select = (
    <select
      className={`modal-dropdown ${className}`.trim()}
      value={value}
      disabled={disabled}
      aria-label={label ? undefined : ariaLabel}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => {
        const { value: optionValue, label: optionLabel } =
          typeof option === "string"
            ? { value: option, label: option }
            : option;

        return (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        );
      })}
    </select>
  );

  if (!label) {
    return select;
  }

  return (
    <label className="modal-field">
      <span className="modal-field-label">{label}</span>
      {select}
    </label>
  );
}
