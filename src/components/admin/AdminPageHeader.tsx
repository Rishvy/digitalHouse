"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-foreground/10 pb-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-foreground/50">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function AdminBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/50 transition-colors hover:text-foreground">
      <span className="material-symbols-outlined text-sm">arrow_back</span>
      {label}
    </Link>
  );
}
