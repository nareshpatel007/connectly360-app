"use client";

import React, { useState } from "react";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search records...",
  filters,
  actions,
  className
}: FilterBarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(e);
    }
  };

  return (
    <div className={cn("p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-2xs font-sans", className)}>
      {/* Search Input */}
      {onSearchChange !== undefined && (
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              value={search || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8 h-10 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl text-xs font-medium focus-visible:ring-[#35877D]"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {onSearchSubmit && (
            <Button type="submit" size="sm" className="h-10 px-4 bg-[#35877D] hover:bg-[#2b6e66] text-white rounded-xl text-xs font-bold cursor-pointer border-0 shadow-2xs shrink-0">
              Search
            </Button>
          )}
        </form>
      )}

      {/* Desktop Filters */}
      {filters && (
        <div className="hidden sm:flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0">
            <Filter size={14} />
            <span>Filters:</span>
          </div>
          {filters}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">{actions}</div>
      )}

      {/* Mobile Drawer Filter Trigger */}
      {(filters || actions) && (
        <div className="flex sm:hidden items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {filters && (
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs font-bold rounded-xl border-slate-200 flex-1 flex items-center justify-center gap-2">
                  <SlidersHorizontal size={14} className="text-[#35877D]" />
                  <span>Filter Options</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl p-6 font-sans space-y-4">
                <SheetHeader>
                  <SheetTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Filter size={16} className="text-[#35877D]" /> Filter Options
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-3 pt-2 flex flex-col">{filters}</div>
              </SheetContent>
            </Sheet>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
