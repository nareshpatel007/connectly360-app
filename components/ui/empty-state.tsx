import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("py-12 px-6 text-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200/90 space-y-3 font-sans my-4", className)}>
      <div className="h-12 w-12 rounded-2xl bg-white text-slate-400 border border-slate-200 flex items-center justify-center mx-auto shadow-2xs">
        <Icon size={22} />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-black text-slate-900 tracking-tight">{title}</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">{description}</p>
      </div>
      {action && <div className="pt-2 flex justify-center gap-2">{action}</div>}
    </div>
  );
}
