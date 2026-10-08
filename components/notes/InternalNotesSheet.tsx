"use client";

import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { InternalNotesPanel } from "@/components/notes/InternalNotesPanel";
import { StickyNote } from "lucide-react";

interface InternalNotesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerId: number;
    conversationId?: number | null;
    customerName?: string;
}

export function InternalNotesSheet({
    open,
    onOpenChange,
    customerId,
    conversationId,
    customerName,
}: InternalNotesSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md bg-white p-5 overflow-y-auto border-l border-slate-200 z-50 flex flex-col space-y-4"
            >
                <SheetHeader className="border-b border-slate-100 pb-3 text-left">
                    <SheetTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <StickyNote size={16} className="text-amber-500" />
                        Internal Notes {customerName ? `— ${customerName}` : ""}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-slate-500">
                        Private workspace notes for team collaboration and context.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1">
                    <InternalNotesPanel
                        customerId={customerId}
                        conversationId={conversationId}
                        customerName={customerName}
                        showScopeFilter={true}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
