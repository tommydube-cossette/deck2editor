"use client";
import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";

const inputCls = "w-full rounded-control border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";
const mustCls = "border-amber-400 bg-amber-50";

export function Label({ children, required, hint, htmlFor }: { children: ReactNode; required?: boolean; hint?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700">
      {children}{required && <span className="ml-0.5 text-red-500" title="Obligatoire">*</span>}
      {hint && <span className="ml-2 text-xs font-normal text-gray-500">{hint}</span>}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: ReactNode; required?: boolean; hint?: string; must?: boolean; max?: number; }
export function Input({ label, required, hint, must, max, className = "", value, id, ...rest }: InputProps) {
  const gen = useId(); const ident = id || gen;
  const len = typeof value === "string" ? value.length : 0;
  const over = !!max && len > max;
  const vide = required && !String(value ?? "").trim();
  return (
    <div className="min-w-0">
      {label && <Label htmlFor={ident} required={required} hint={hint}>{label}</Label>}
      <div className="relative">
        <input id={ident} className={`${inputCls} ${must || vide ? mustCls : ""} ${over ? "border-red-400 bg-red-50" : ""} ${max ? "pr-16" : ""} ${className}`} value={value} {...rest} />
        {!!max && <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] tabular-nums ${over ? "font-semibold text-red-600" : "text-gray-400"}`}>{len}/{max}</span>}
      </div>
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: ReactNode; required?: boolean; hint?: string; options: (string | [string, string, boolean?])[]; }
export function Select({ label, required, hint, options, className = "", value, id, ...rest }: SelectProps) {
  const gen = useId(); const ident = id || gen;
  const vide = required && !String(value ?? "").trim();
  return (
    <div className="min-w-0">
      {label && <Label htmlFor={ident} required={required} hint={hint}>{label}</Label>}
      <select id={ident} className={`${inputCls} ${vide ? mustCls : ""} ${className}`} value={value} {...rest}>
        {options.map((o) => {
          const [v, t, dis] = Array.isArray(o) ? o : [o, o, false];
          return <option key={v + t} value={v} disabled={dis}>{t === "" ? "—" : t}</option>;
        })}
      </select>
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: ReactNode; hint?: string; }
export function Textarea({ label, hint, className = "", id, ...rest }: TextareaProps) {
  const gen = useId(); const ident = id || gen;
  return (
    <div className="min-w-0">
      {label && <Label htmlFor={ident} hint={hint}>{label}</Label>}
      <textarea id={ident} className={`${inputCls} min-h-[104px] leading-relaxed ${className}`} {...rest} />
    </div>
  );
}

export function Check({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-control border border-gray-300 bg-white px-3 py-2 hover:border-gray-400">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm leading-tight">{label}{sub && <span className="mt-0.5 block text-xs text-gray-500">{sub}</span>}</span>
    </label>
  );
}

/* Boutons-pastilles de choix (btn-pop-mono), comme Division / Annee dans MediaBox. */
const POP = ["#f2739e", "#4db04f", "#ffc929", "#66d9e5", "#594a99", "#f54236"];
export function Chips({ label, options, value, onChange, required }: { label?: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <button key={o} type="button" onClick={() => onChange(o)} style={{ ["--pop-c1" as string]: POP[i % POP.length] }}
            className={`btn-pop-mono rounded-control border px-4 py-2 text-sm font-medium ${value === o ? "border-primary bg-primary-50 text-primary-700" : "border-gray-300 bg-white text-gray-700 hover:border-primary"}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}
