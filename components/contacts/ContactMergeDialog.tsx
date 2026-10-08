"use client";

import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    ArrowRightLeft,
    CheckCircle2,
    ShieldCheck,
    MessageCircle,
    FileText,
    Briefcase,
    CheckSquare,
    Clock,
    Tag,
    AlertTriangle,
    Loader2,
    Building2,
    Mail,
    Phone,
    MapPin,
    User
} from "lucide-react";
import { toast } from "sonner";
import { useMergeContacts, Customer } from "@/lib/api-client-react";

interface ContactMergeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    primaryContact: any | null;
    secondaryContact: any | null;
    onMergeComplete?: (masterId: number) => void;
}

export function ContactMergeDialog({
    open,
    onOpenChange,
    primaryContact,
    secondaryContact,
    onMergeComplete
}: ContactMergeDialogProps) {
    const mergeMutation = useMergeContacts();

    // Which contact is designated Master (1 or 2)
    const [masterRole, setMasterRole] = useState<1 | 2>(1);

    // Selected field values when conflicts exist
    const [selectedFields, setSelectedFields] = useState<{
        name: string;
        email: string;
        company: string;
        city: string;
    }>({
        name: "",
        email: "",
        company: "",
        city: "",
    });

    const c1 = primaryContact;
    const c2 = secondaryContact;

    const master = masterRole === 1 ? c1 : c2;
    const secondary = masterRole === 1 ? c2 : c1;

    useEffect(() => {
        if (open && c1 && c2) {
            setMasterRole(1);
            setSelectedFields({
                name: c1.name || c2.name || "",
                email: c1.email || c2.email || "",
                company: c1.company || c2.company || "",
                city: c1.city || c2.city || "",
            });
        }
    }, [open, c1, c2]);

    if (!c1 || !c2) return null;

    const handleSwapMaster = () => {
        const newRole = masterRole === 1 ? 2 : 1;
        setMasterRole(newRole);
        const newMaster = newRole === 1 ? c1 : c2;
        const newSec = newRole === 1 ? c2 : c1;

        setSelectedFields({
            name: newMaster.name || newSec.name || "",
            email: newMaster.email || newSec.email || "",
            company: newMaster.company || newSec.company || "",
            city: newMaster.city || newSec.city || "",
        });
    };

    const handleExecuteMerge = async () => {
        if (!master || !secondary) return;

        try {
            const res = await mergeMutation.mutateAsync({
                master_id: master.id,
                source_ids: [secondary.id],
                field_overrides: {
                    name: selectedFields.name || master.name,
                    email: selectedFields.email || master.email,
                    company: selectedFields.company || master.company,
                    city: selectedFields.city || master.city,
                },
            });

            toast.success(res.message || `Contacts merged successfully into ${master.name}!`);
            onOpenChange(false);
            if (onMergeComplete) {
                onMergeComplete(master.id);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to merge contacts.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl font-bold text-slate-900">
                            Merge Duplicate Contacts
                        </DialogTitle>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            Zero Data Loss
                        </Badge>
                    </div>
                    <DialogDescription className="text-sm text-slate-500">
                        Combine duplicate records into a single primary contact. All conversation messages, internal notes, tasks, leads, and timeline events will be safely unified.
                    </DialogDescription>
                </DialogHeader>

                {/* Swap / Role Selector Banner */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-600">
                        <strong>Primary Contact:</strong>{" "}
                        <span className="font-semibold text-indigo-600">
                            {master?.name || "Unnamed"} ({master?.phone})
                        </span>{" "}
                        will be preserved. Secondary contact will be merged and purged.
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSwapMaster}
                        className="text-xs h-8 gap-1.5 border-slate-300 hover:bg-slate-100"
                    >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                        Swap Primary Role
                    </Button>
                </div>

                {/* Side-by-Side Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Master Card */}
                    <div className="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/20 shadow-sm relative">
                        <div className="absolute top-3 right-3">
                            <Badge className="bg-indigo-600 text-white font-medium text-xs">
                                Primary (Master)
                            </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mb-1">
                            {master?.name || "Unnamed Contact"}
                        </h4>
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {master?.phone}
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-indigo-100">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{master?.email || <em className="text-slate-400">No email</em>}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{master?.company || <em className="text-slate-400">No company</em>}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{master?.city || <em className="text-slate-400">No location</em>}</span>
                            </div>
                        </div>

                        {/* Existing counts */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-indigo-100 text-center">
                            <div className="bg-white p-2 rounded border border-indigo-100">
                                <div className="text-[11px] text-slate-400 font-medium">Messages</div>
                                <div className="text-sm font-bold text-slate-800">
                                    {master?.conversations_count ?? master?.messageCount ?? 0}
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded border border-indigo-100">
                                <div className="text-[11px] text-slate-400 font-medium">Tasks</div>
                                <div className="text-sm font-bold text-slate-800">
                                    {master?.tasks_count ?? 0}
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded border border-indigo-100">
                                <div className="text-[11px] text-slate-400 font-medium">Leads</div>
                                <div className="text-sm font-bold text-slate-800">
                                    {master?.leads_count ?? 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Card */}
                    <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/20 shadow-sm relative">
                        <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-medium text-xs">
                                Secondary (Will Merge)
                            </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mb-1">
                            {secondary?.name || "Unnamed Contact"}
                        </h4>
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {secondary?.phone}
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-amber-100">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{secondary?.email || <em className="text-slate-400">No email</em>}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{secondary?.company || <em className="text-slate-400">No company</em>}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{secondary?.city || <em className="text-slate-400">No location</em>}</span>
                            </div>
                        </div>

                        {/* Existing counts */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-amber-100 text-center">
                            <div className="bg-white p-2 rounded border border-amber-100">
                                <div className="text-[11px] text-slate-400 font-medium">Messages</div>
                                <div className="text-sm font-bold text-slate-800">
                                    {secondary?.conversations_count ?? secondary?.messageCount ?? 0}
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded border border-amber-100">
                                <div className="text-[11px] text-slate-400 font-medium">Tasks</div>
                                <div className="text-sm font-bold text-slate-800">
                                    {secondary?.tasks_count ?? 0}
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded border border-amber-100">
                                <div className="text-[11px] text-slate-400 font-medium">Leads</div>
                                <div className="text-sm font-bold text-slate-800">
                                    {secondary?.leads_count ?? 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Field Conflicts Resolution Selector */}
                {(master?.name !== secondary?.name ||
                  master?.email !== secondary?.email ||
                  master?.company !== secondary?.company ||
                  master?.city !== secondary?.city) && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Field Conflict Resolution (Choose Master Values)
                        </div>

                        {master?.name !== secondary?.name && (
                            <div className="text-xs space-y-1">
                                <Label className="text-slate-700 font-semibold">Contact Name:</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="fieldName"
                                            checked={selectedFields.name === master.name}
                                            onChange={() => setSelectedFields(prev => ({ ...prev, name: master.name }))}
                                            className="text-indigo-600"
                                        />
                                        <span>{master.name || "Master"}</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="fieldName"
                                            checked={selectedFields.name === secondary.name}
                                            onChange={() => setSelectedFields(prev => ({ ...prev, name: secondary.name }))}
                                            className="text-indigo-600"
                                        />
                                        <span>{secondary.name || "Secondary"}</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {master?.email !== secondary?.email && (master?.email || secondary?.email) && (
                            <div className="text-xs space-y-1">
                                <Label className="text-slate-700 font-semibold">Email Address:</Label>
                                <div className="flex gap-4">
                                    {master.email && (
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fieldEmail"
                                                checked={selectedFields.email === master.email}
                                                onChange={() => setSelectedFields(prev => ({ ...prev, email: master.email }))}
                                                className="text-indigo-600"
                                            />
                                            <span>{master.email}</span>
                                        </label>
                                    )}
                                    {secondary.email && (
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fieldEmail"
                                                checked={selectedFields.email === secondary.email}
                                                onChange={() => setSelectedFields(prev => ({ ...prev, email: secondary.email }))}
                                                className="text-indigo-600"
                                            />
                                            <span>{secondary.email}</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}

                        {master?.company !== secondary?.company && (master?.company || secondary?.company) && (
                            <div className="text-xs space-y-1">
                                <Label className="text-slate-700 font-semibold">Company:</Label>
                                <div className="flex gap-4">
                                    {master.company && (
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fieldCompany"
                                                checked={selectedFields.company === master.company}
                                                onChange={() => setSelectedFields(prev => ({ ...prev, company: master.company }))}
                                                className="text-indigo-600"
                                            />
                                            <span>{master.company}</span>
                                        </label>
                                    )}
                                    {secondary.company && (
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fieldCompany"
                                                checked={selectedFields.company === secondary.company}
                                                onChange={() => setSelectedFields(prev => ({ ...prev, company: secondary.company }))}
                                                className="text-indigo-600"
                                            />
                                            <span>{secondary.company}</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Items Transferred Guarantee */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1.5">
                    <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Guaranteed Unified Records
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-emerald-800">
                        <div className="flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            All WhatsApp chats & media
                        </div>
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            Internal notes & discussions
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            Follow-up tasks & deadlines
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                            Pipeline deals & leads
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={mergeMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExecuteMerge}
                        disabled={mergeMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                        {mergeMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Merging Contacts...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Confirm & Merge Contacts
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
