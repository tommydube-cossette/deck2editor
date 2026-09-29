"use client";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; pop?: boolean; }

/* Boutons MediaBox : primaire violet avec effet btn-pop, secondaire blanc bordure gray-300. */
const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = "secondary", size = "md", pop = false, className = "", style, ...rest }, ref) {
  const base = "inline-flex items-center justify-center whitespace-nowrap font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 rounded-control gap-2";
  const sizes = size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm";
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-white hover:bg-primary-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.98]",
    ghost: "text-gray-600 hover:bg-gray-100",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
  };
  const popCls = pop && variant === "primary" ? "btn-pop will-change-transform" : "";
  return <button ref={ref} className={`${base} ${sizes} ${variants[variant]} ${popCls} ${className}`} style={pop ? { ["--pop-c1" as string]: "#66d9e5", ["--pop-c2" as string]: "#4db04f", ...style } : style} {...rest} />;
});
export default Button;
