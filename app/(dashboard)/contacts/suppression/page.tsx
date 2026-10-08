"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    useSuppressionList,
    useAddSuppressedNumber,
    useRemoveSuppressedNumber,
    SuppressedNumber,
} from "@/lib/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Ban,
    Search,
    Plus,
    Trash2,
    ShieldAlert,
    ShieldCheck,
    Phone,
    User,
    Calendar,
    ArrowLeft,
    FileText,
    AlertTriangle,
    Loader2,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { BLOCK_REASONS } from "@/components/contacts/BlockContactModal";

export default function SuppressionPage() {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [searchTerm, setSearchTerm] = useState("");
    const [reasonFilter, setReasonFilter] = useState("all");

    // Modal state for adding a suppressed phone
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newPhone, setNewPhone] = useState("");
    const [newReason, setNewReason] = useState("manual_suppression");
    const [newNotes, setNewNotes] = useState("");

    // Modal state for removing
    const [itemToRemove, setItemToRemove] = useState<SuppressedNumber | null>(null);

    const { data: suppressionData, isLoading } = useSuppressionList({
        page,
        per_page: perPage,
        search: searchTerm,
        reason: reasonFilter,
    });

    const addMutation = useAddSuppressedNumber();
    const removeMutation = useRemoveSuppressedNumber();

    const items: SuppressedNumber[] = suppressionData?.data || [];
    const meta = suppressionData?.meta || {};
    const reasonSummary = suppressionData?.reason_summary || {};
    const totalCount = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;

    const handleAddNumber = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhone.trim()) {
            toast.error("Please provide a valid phone number");
            return;
        }

        try {
            await addMutation.mutateAsync({
                phone: newPhone.trim(),
                reason: newReason,
                notes: newNotes.trim() || undefined,
            });
            toast.success(`Phone number ${newPhone} added to suppression list`);
            setIsAddOpen(false);
            setNewPhone("");
            setNewNotes("");
        } catch (err: any) {
            toast.error(err.message || "Failed to add phone number to suppression list");
        }
    };

    const handleConfirmRemove = async () => {
        if (!itemToRemove) return;
        try {
            await removeMutation.mutateAsync(itemToRemove.id);
            toast.success(`Removed ${itemToRemove.phone} from suppression list`);
            setItemToRemove(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to remove phone from suppression list");
        }
    };

    const getReasonBadge = (reason: string) => {
        switch (reason) {
            case "manual_block":
                return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 text-[10px]">Manual Block</Badge>;
            case "spam_complaint":
                return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">Spam Complaint</Badge>;
            case "compliance_dnd":
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Compliance / DND</Badge>;
            case "abusive":
                return <Badge variant="destructive" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px]">Abusive Behavior</Badge>;
            case "invalid_number":
                return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">Invalid Number</Badge>;
            case "fraud":
                return <Badge variant="destructive" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">Fraud Flag</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] uppercase">{reason.replace(/_/g, " ")}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Suppression List & Blocked Numbers"
                description="Manage excluded phone numbers and prevent unauthorized or unsubscribed WhatsApp broadcasts across the workspace."
                breadcrumbs={[
                    { label: "Contacts", href: "/contacts" },
                    { label: "Suppression List" },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/contacts">
                            <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl gap-1.5 font-semibold">
                                <ArrowLeft size={14} /> Back to Contacts
                            </Button>
                        </Link>
                        <Button
                            size="sm"
                            onClick={() => setIsAddOpen(true)}
                            className="bg-[#35877D] hover:bg-[#2d736a] text-white text-xs h-9 px-4 rounded-xl gap-1.5 font-semibold shadow-sm"
                        >
                            <Plus size={15} /> Suppress Number
                        </Button>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Total Suppressed
                            </div>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {isLoading ? <Skeleton className="h-6 w-16" /> : totalCount.toLocaleString()}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                            <Ban size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                                Manual Blocks
                            </div>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {isLoading ? <Skeleton className="h-6 w-12" /> : (reasonSummary.manual_block || 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                            <ShieldAlert size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                                Compliance / DND
                            </div>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {isLoading ? <Skeleton className="h-6 w-12" /> : (reasonSummary.compliance_dnd || 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <ShieldCheck size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                                Spam Complaints
                            </div>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {isLoading ? <Skeleton className="h-6 w-12" /> : (reasonSummary.spam_complaint || 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <AlertTriangle size={18} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <Input
                        placeholder="Search suppressed phone numbers, contacts, notes..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9 text-xs h-9 bg-slate-50/60 border-slate-200 rounded-xl focus:bg-white"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span>Reason:</span>
                        <select
                            value={reasonFilter}
                            onChange={(e) => {
                                setReasonFilter(e.target.value);
                                setPage(1);
                            }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none"
                        >
                            <option value="all">All Reasons</option>
                            <option value="manual_block">Manual Block</option>
                            <option value="spam_complaint">Spam Complaint</option>
                            <option value="compliance_dnd">Compliance / DND</option>
                            <option value="abusive">Abusive Behavior</option>
                            <option value="invalid_number">Invalid Number</option>
                            <option value="fraud">Fraud</option>
                            <option value="manual_suppression">Manual Suppression</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span>Show:</span>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 font-semibold focus:outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Suppression List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-3.5 pl-4">Phone Number</th>
                                <th className="p-3.5">Associated Contact</th>
                                <th className="p-3.5">Reason</th>
                                <th className="p-3.5">Notes & Details</th>
                                <th className="p-3.5">Added Date</th>
                                <th className="p-3.5 pr-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3.5 pl-4"><Skeleton className="h-4 w-28" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-32" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-20" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-40" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-3.5 pr-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                {searchTerm || reasonFilter !== "all"
                                                    ? "No suppressed numbers match these filters"
                                                    : "Suppression list is empty"}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {searchTerm || reasonFilter !== "all"
                                                    ? "Try clearing your search query or choosing all reasons."
                                                    : "All contacts in this workspace are eligible for WhatsApp broadcasts."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400" />
                                            {item.phone}
                                        </td>
                                        <td className="p-3.5">
                                            {item.customer ? (
                                                <Link
                                                    href={`/contacts/${item.customer.id}`}
                                                    className="font-semibold text-slate-800 hover:text-[#35877D] hover:underline flex items-center gap-1"
                                                >
                                                    <User size={12} className="text-slate-400" />
                                                    {item.customer.name || item.customer.phone}
                                                </Link>
                                            ) : (
                                                <span className="text-slate-400 italic">Direct suppression</span>
                                            )}
                                        </td>
                                        <td className="p-3.5">{getReasonBadge(item.reason)}</td>
                                        <td className="p-3.5 text-slate-600 max-w-xs truncate" title={item.notes || ""}>
                                            {item.notes ? (
                                                <span className="flex items-center gap-1">
                                                    <FileText size={12} className="text-slate-400 shrink-0" />
                                                    {item.notes}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-slate-500 text-[11px]">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-slate-400" />
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-3.5 pr-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setItemToRemove(item)}
                                                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold gap-1"
                                            >
                                                <Trash2 size={13} />
                                                Unsuppress
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-3.5 px-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <div>
                        Showing <strong>{items.length}</strong> of <strong>{totalCount}</strong> numbers
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-7 text-xs px-2.5 rounded-lg font-semibold"
                        >
                            Previous
                        </Button>
                        <span className="text-[11px] font-bold text-slate-700">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="h-7 text-xs px-2.5 rounded-lg font-semibold"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add Suppressed Number Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-red-50 text-red-600">
                                <Ban className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Add Phone Number to Suppression
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Prevent all future campaign and automated WhatsApp messages to this phone number.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAddNumber} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs font-semibold">Phone Number *</Label>
                            <Input
                                id="phone"
                                placeholder="+1 555 123 4567 or +91 9876543210"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                className="text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Exclusion Reason *</Label>
                            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                                {BLOCK_REASONS.map((r) => (
                                    <label
                                        key={r.value}
                                        onClick={() => setNewReason(r.value)}
                                        className={`flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                            newReason === r.value
                                                ? "border-red-500 bg-red-50/50 text-red-950 font-medium"
                                                : "border-muted hover:bg-muted/40"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="suppression_reason"
                                            value={r.value}
                                            checked={newReason === r.value}
                                            onChange={() => setNewReason(r.value)}
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

                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-semibold">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Audit note on why this number was suppressed..."
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.target.value)}
                                rows={2}
                                className="text-xs resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddOpen(false)}
                                disabled={addMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                variant="destructive"
                                disabled={addMutation.isPending}
                            >
                                {addMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        Suppressing...
                                    </>
                                ) : (
                                    <>
                                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                                        Confirm Suppression
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove / Unsuppress Confirmation Dialog */}
            <Dialog open={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Unsuppress Phone Number
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Remove from the suppression list and restore eligibility for WhatsApp messages.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {itemToRemove && (
                        <div className="py-2 text-xs space-y-2">
                            <p className="text-muted-foreground">
                                Are you sure you want to unsuppress{" "}
                                <strong className="text-slate-900 font-mono">{itemToRemove.phone}</strong>?
                            </p>
                            {itemToRemove.reason && (
                                <p className="text-[11px] text-slate-500">
                                    Originally suppressed for: <strong>{itemToRemove.reason}</strong>
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setItemToRemove(null)}
                            disabled={removeMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmRemove}
                            disabled={removeMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {removeMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    Unsuppressing...
                                </>
                            ) : (
                                "Confirm Unsuppress"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
