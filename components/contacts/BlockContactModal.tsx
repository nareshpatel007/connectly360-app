"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Ban,
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    Loader2,
    Calendar,
    FileText,
    CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
    useBlockContact,
    useUnblockContact,
    useBulkBlockContacts,
    useBulkUnblockContacts,
} from "@/lib/api-client-react";

interface BlockContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Either single customer or bulk customer IDs
    customer?: {
        id: number;
        name?: string;
        phone: string;
        is_blocked?: boolean;
        blocked_at?: string;
        blocked_reason?: string;
        blocked_notes?: string;
    } | null;
    bulkIds?: number[];
    isBulkUnblock?: boolean;
    onSuccess?: () => void;
}

export const BLOCK_REASONS = [
    { value: "manual_block", label: "Manual Admin / Agent Block", description: "Standard agent-initiated block" },
    { value: "spam_complaint", label: "Spam Complaint / Flagged", description: "Contact reported messaging as spam" },
    { value: "abusive", label: "Abusive / Harassing Behavior", description: "Inappropriate language or behavior" },
    { value: "compliance_dnd", label: "Compliance / Do Not Disturb", description: "Requested strict regulatory exclusion" },
    { value: "invalid_number", label: "Invalid / Non-functional Number", description: "Bounced or disconnected WhatsApp number" },
    { value: "fraud", label: "Fraud / Suspicious Activity", description: "Scam or unauthorized account" },
];

export function BlockContactModal({
    isOpen,
    onClose,
    customer,
    bulkIds,
    isBulkUnblock = false,
    onSuccess,
}: BlockContactModalProps) {
    const isBulk = Array.isArray(bulkIds) && bulkIds.length > 0;
    const isBlocked = isBulk ? isBulkUnblock : Boolean(customer?.is_blocked);

    const [reason, setReason] = useState<string>("manual_block");
    const [notes, setNotes] = useState<string>("");

    const blockMutation = useBlockContact();
    const unblockMutation = useUnblockContact();
    const bulkBlockMutation = useBulkBlockContacts();
    const bulkUnblockMutation = useBulkUnblockContacts();

    const isPending =
        blockMutation.isPending ||
        unblockMutation.isPending ||
        bulkBlockMutation.isPending ||
        bulkUnblockMutation.isPending;

    const handleConfirm = async () => {
        try {
            if (isBulk) {
                if (isBulkUnblock) {
                    await bulkUnblockMutation.mutateAsync({ ids: bulkIds });
                    toast.success(`Successfully unblocked ${bulkIds.length} contact(s)`);
                } else {
                    await bulkBlockMutation.mutateAsync({
                        ids: bulkIds,
                        reason,
                        notes: notes.trim() || undefined,
                    });
                    toast.success(`Successfully blocked ${bulkIds.length} contact(s)`);
                }
            } else if (customer) {
                if (customer.is_blocked) {
                    await unblockMutation.mutateAsync({ customerId: customer.id });
                    toast.success(`Contact ${customer.name || customer.phone} has been unblocked`);
                } else {
                    await blockMutation.mutateAsync({
                        customerId: customer.id,
                        reason,
                        notes: notes.trim() || undefined,
                    });
                    toast.success(`Contact ${customer.name || customer.phone} is now blocked`);
                }
            }

            setNotes("");
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update blocklist status");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div
                            className={`p-2 rounded-lg ${
                                isBlocked
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                            }`}
                        >
                            {isBlocked ? <ShieldCheck className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                {isBlocked
                                    ? isBulk
                                        ? `Unblock ${bulkIds?.length} Contacts`
                                        : `Unblock ${customer?.name || customer?.phone || "Contact"}`
                                    : isBulk
                                        ? `Block ${bulkIds?.length} Contacts`
                                        : `Block ${customer?.name || customer?.phone || "Contact"}`}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                {isBlocked
                                    ? "Restore messaging ability and remove from suppression lists."
                                    : "Completely suppress and exclude from all campaigns and outbound messages."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* If Currently Blocked (Single Contact View) */}
                {!isBulk && customer?.is_blocked ? (
                    <div className="space-y-4 py-2">
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                                    <ShieldAlert className="h-4 w-4" /> Currently Blocked
                                </span>
                                <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">
                                    {customer.blocked_reason || "Blocked"}
                                </Badge>
                            </div>
                            {customer.blocked_at && (
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Blocked on:{" "}
                                    {new Date(customer.blocked_at).toLocaleDateString()} at{" "}
                                    {new Date(customer.blocked_at).toLocaleTimeString()}
                                </p>
                            )}
                            {customer.blocked_notes && (
                                <p className="text-muted-foreground flex items-start gap-1">
                                    <FileText className="h-3 w-3 mt-0.5" /> Notes: {customer.blocked_notes}
                                </p>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Unblocking this contact will remove their phone number from the workspace suppression
                            list and restore their eligibility to receive campaign broadcasts and manual WhatsApp messages.
                        </p>
                    </div>
                ) : isBulk && isBulkUnblock ? (
                    <div className="py-2 space-y-3">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-3 text-xs space-y-1">
                            <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" /> Confirm Bulk Unblock
                            </p>
                            <p className="text-muted-foreground">
                                Are you sure you want to unblock {bulkIds?.length} selected contact(s)? They will become eligible for messaging immediately.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Blocking View (Single or Bulk) */
                    <div className="space-y-4 py-2">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                                <AlertTriangle className="h-4 w-4 text-amber-600" /> Suppression Safeguard
                            </div>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
                                <li>All broadcast campaigns will automatically exclude this phone.</li>
                                <li>Added to workspace suppression database.</li>
                                <li>Recorded on contact timeline and activity audit logs.</li>
                            </ul>
                        </div>

                        {/* Reason Selector */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Block Reason *</Label>
                            <div className="grid grid-cols-1 gap-1.5">
                                {BLOCK_REASONS.map((r) => (
                                    <label
                                        key={r.value}
                                        onClick={() => setReason(r.value)}
                                        className={`flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                            reason === r.value
                                                ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-950 dark:text-red-200 font-medium"
                                                : "border-muted hover:bg-muted/40 text-foreground"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="block_reason"
                                            value={r.value}
                                            checked={reason === r.value}
                                            onChange={() => setReason(r.value)}
                                            className="mt-0.5 accent-red-600"
                                        />
                                        <div>
                                            <div className="font-medium">{r.label}</div>
                                            <div className="text-[11px] text-muted-foreground font-normal">
                                                {r.description}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Internal Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="block_notes" className="text-xs font-semibold">
                                Internal Notes (Optional)
                            </Label>
                            <Textarea
                                id="block_notes"
                                placeholder="Explain why this contact or number is being blocked..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="text-xs resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant={isBlocked ? "default" : "destructive"}
                        onClick={handleConfirm}
                        disabled={isPending}
                        className={isBlocked ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Processing...
                            </>
                        ) : isBlocked ? (
                            <>
                                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                                {isBulk ? "Confirm Unblock" : "Unblock Contact"}
                            </>
                        ) : (
                            <>
                                <Ban className="mr-1.5 h-3.5 w-3.5" />
                                {isBulk ? `Block ${bulkIds?.length} Contacts` : "Block & Suppress"}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
