"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Users,
    Phone,
    Mail,
    Search,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Loader2,
    Calendar,
    MessageCircle,
    Building2,
    Layers
} from "lucide-react";
import {
    useTenantDuplicates,
    DuplicateGroup,
    DuplicateCandidate
} from "@/lib/api-client-react";
import { ContactMergeDialog } from "./ContactMergeDialog";

interface DuplicateContactsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DuplicateContactsModal({
    open,
    onOpenChange
}: DuplicateContactsModalProps) {
    const { data: duplicateGroups = [], isLoading, isRefetching, refetch } = useTenantDuplicates();
    const [searchTerm, setSearchTerm] = useState("");

    // Active merge dialog state
    const [mergePair, setMergePair] = useState<{
        primary: DuplicateCandidate | null;
        secondary: DuplicateCandidate | null;
    } | null>(null);

    const filteredGroups = duplicateGroups.filter(group => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        if (group.match_value.toLowerCase().includes(q)) return true;
        return group.contacts.some(c =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
    });

    const handleOpenMergePair = (c1: DuplicateCandidate, c2: DuplicateCandidate) => {
        setMergePair({
            primary: c1,
            secondary: c2
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
                    <DialogHeader className="pb-3 border-b border-slate-100">
                        <div className="flex items-center justify-between pr-6">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-slate-900">
                                        Duplicate Contact Detection & Merge
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                        Scan and consolidate contacts sharing identical normalized phone numbers or emails.
                                    </DialogDescription>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading || isRefetching}
                                className="h-8 gap-1.5 text-xs text-slate-600"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
                                Re-scan
                            </Button>
                        </div>

                        {/* Search Bar */}
                        <div className="pt-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filter by contact name, phone, or email..."
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                                <p className="text-sm">Scanning workspace for duplicate contacts...</p>
                            </div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-800">
                                    {searchTerm ? "No matching duplicates found" : "No Duplicate Contacts Found"}
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm mt-1">
                                    {searchTerm
                                        ? "Try adjusting your search criteria."
                                        : "Your contact database is completely unified! No contacts with duplicate phone numbers or emails were detected."}
                                </p>
                            </div>
                        ) : (
                            filteredGroups.map((group) => (
                                <div
                                    key={group.group_key}
                                    className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3"
                                >
                                    {/* Group Header */}
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs font-semibold ${
                                                    group.type === "phone"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-purple-50 text-purple-700 border-purple-200"
                                                }`}
                                            >
                                                {group.type === "phone" ? (
                                                    <Phone className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <Mail className="w-3 h-3 mr-1" />
                                                )}
                                                {group.type === "phone" ? "Matching Phone" : "Matching Email"}: {group.match_value}
                                            </Badge>
                                            <span className="text-xs text-slate-500">
                                                • {group.contacts.length} duplicate contacts detected
                                            </span>
                                        </div>

                                        {group.contacts.length >= 2 && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleOpenMergePair(group.contacts[0], group.contacts[1])}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-2.5 gap-1"
                                            >
                                                Review & Merge
                                                <ArrowRight className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Contact List */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {group.contacts.map((contact, idx) => (
                                            <div
                                                key={contact.id}
                                                className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                                                    idx === 0
                                                        ? "bg-slate-50/70 border-slate-200"
                                                        : "bg-amber-50/20 border-amber-200"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-900 text-sm">
                                                        {contact.name || "Unnamed"}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] text-slate-500">
                                                        ID #{contact.id}
                                                    </Badge>
                                                </div>

                                                <div className="text-slate-600 flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    {contact.phone}
                                                </div>

                                                {contact.email && (
                                                    <div className="text-slate-600 flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3 text-slate-400" />
                                                        {contact.email}
                                                    </div>
                                                )}

                                                {contact.company && (
                                                    <div className="text-slate-600 flex items-center gap-1.5">
                                                        <Building2 className="w-3 h-3 text-slate-400" />
                                                        {contact.company}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                                                    <span>Messages: <strong>{contact.conversations_count ?? 0}</strong></span>
                                                    <span>Tasks: <strong>{contact.tasks_count ?? 0}</strong></span>
                                                    <span>Leads: <strong>{contact.leads_count ?? 0}</strong></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter className="pt-3 border-t border-slate-100">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-dialog for comparing and executing merge */}
            {mergePair && (
                <ContactMergeDialog
                    open={!!mergePair}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) setMergePair(null);
                    }}
                    primaryContact={mergePair.primary}
                    secondaryContact={mergePair.secondary}
                    onMergeComplete={() => {
                        setMergePair(null);
                        refetch();
                    }}
                />
            )}
        </>
    );
}
