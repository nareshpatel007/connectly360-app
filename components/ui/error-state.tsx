import React from "react";
import { AlertCircle, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  supportLink?: string;
  className?: string;
}

export function ErrorState({
  title = "Unable to load data",
  description = "Something went wrong while loading this information. Please verify your connection or try again.",
  onRetry,
  supportLink = "mailto:support@connectly360.com",
  className
}: ErrorStateProps) {
  return (
    <div className={cn("py-12 px-6 text-center bg-white border border-rose-200/80 rounded-3xl space-y-4 shadow-xs max-w-lg mx-auto font-sans my-4", className)}>
      <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-2xs">
        <AlertCircle size={24} />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">{description}</p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            className="h-10 px-4 bg-[#35877D] hover:bg-[#2b6e66] text-white rounded-xl text-xs font-bold border-0 shadow-2xs cursor-pointer flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </Button>
        )}
        {supportLink && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
          >
            <a href={supportLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
              <HelpCircle size={14} className="text-slate-400" />
              <span>Contact Support</span>
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
