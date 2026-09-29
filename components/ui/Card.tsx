import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-surface border border-gray-300 bg-white ${className}`}>{children}</div>;
}
export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
      <div><h3 className="text-sm font-semibold text-gray-900">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}</div>
      {right}
    </div>
  );
}
export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
export function SectionTitle({ children, meta, bad }: { children: ReactNode; meta?: ReactNode; bad?: boolean }) {
  return (
    <div className="mb-2 mt-5 flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">{children}</span>
      {meta !== undefined && <span className={`ml-auto font-mono text-xs tabular-nums ${bad ? "font-semibold text-red-600" : "text-gray-500"}`}>{meta}</span>}
    </div>
  );
}
