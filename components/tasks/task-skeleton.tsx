"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskListSkeleton() {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <Skeleton className="mt-0.5 h-5 w-5 rounded-md" />
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-64 rounded-md" />
                                <Skeleton className="h-4 w-14 rounded-full" />
                            </div>
                            <Skeleton className="h-3.5 w-96 max-w-full rounded-md" />
                            <div className="flex items-center gap-4 pt-1">
                                <Skeleton className="h-3 w-24 rounded-md" />
                                <Skeleton className="h-3 w-28 rounded-md" />
                                <Skeleton className="h-3 w-32 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
