"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  breadcrumbs,
  badge,
  actions,
  children
}: PageHeaderProps) {
  return (
    <div className="space-y-4 border-b border-slate-200/80 pb-5 mb-6 font-sans">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
            Home
          </Link>
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={12} className="text-slate-300" />
              {item.href ? (
                <Link href={item.href} className="hover:text-slate-700 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-bold">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          {Icon && (
            <div className="h-11 w-11 rounded-2xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 flex-wrap">
              {title}
              {badge && (
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-gradient-to-r from-[#35877D]/15 to-[#35877D]/5 text-[#35877D] border border-[#35877D]/25 tracking-wider shadow-2xs">
                  {badge}
                </span>
              )}
            </h1>
            {description && (
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-start sm:justify-end">{actions}</div>}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
