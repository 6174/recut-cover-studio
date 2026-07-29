/**
 * [INPUT]: 依赖 React button 与 className
 * [OUTPUT]: 对外提供 Cover Studio 共享按钮与卡片原子
 * [POS]: ui/src 的无业务视觉原子；不读取 App 状态或调用宿主
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

export function Button({ className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" }) {
  const styles = variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/85" : variant === "outline" ? "border bg-card hover:bg-muted" : "hover:bg-muted";
  return <button className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles} ${className}`} {...props} />;
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) { return <section className={`rounded-xl border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.03)] ${className}`} {...props} />; }
