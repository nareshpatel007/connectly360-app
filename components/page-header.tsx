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
    <div className="space-y-3 border-b border-[#E5E9EE] pb-4 mb-5 font-sans">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[11px] font-medium text-[#8A95A3]">
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
                <span className="text-slate-700 font-semibold">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          {Icon && (
            <div className="h-9 w-9 rounded-lg bg-[#E8F6F3] text-[#2F8F83] border border-[#BFE4DD] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              <Icon size={18} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-[#172033] tracking-tight flex items-center gap-2 flex-wrap">
              {title}
              {badge && (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#E8F6F3] text-[#2F8F83] border border-[#BFE4DD]">
                  {badge}
                </span>
              )}
            </h1>
            {description && (
              <p className="text-[13px] text-[#5F6B7A] mt-0.5 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">{actions}</div>}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
