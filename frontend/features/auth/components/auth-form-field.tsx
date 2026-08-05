import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

type AuthFormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  hint?: string;
};

export function AuthFormField({
  label,
  icon,
  hint,
  id,
  type,
  disabled,
  ...inputProps
}: AuthFormFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && isPasswordVisible ? "text" : type;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          id={id}
          {...inputProps}
          type={inputType}
          disabled={disabled}
          className={`min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50 ${isPasswordField ? "pr-12" : "pr-4"}`}
        />
        {isPasswordField ? (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            disabled={disabled}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-50"
          >
            {isPasswordVisible ? (
              <EyeOff className="size-4.5" aria-hidden="true" />
            ) : (
              <Eye className="size-4.5" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
