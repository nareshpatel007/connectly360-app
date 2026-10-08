"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    useListCustomers,
    useCustomerStats,
    Customer
} from "@/lib/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Search,
    MapPin,
    Phone,
    MessageCircle,
    Plus,
    Loader2,
    SlidersHorizontal,
    Upload,
    Download,
    Trash2,
    Edit2,
    ShieldCheck,
    Users,
    BookmarkPlus,
    X,
    Filter,
    CheckCircle2,
    Building2,
    Calendar,
    Send,
    ExternalLink,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";

// CRM and Dialog Components
import { ContactCrmPanel, StageBadge, CrmContact, StageKey, STAGES } from "@/components/contacts/contact-crm-panel";
import { ContactCreateModal } from "@/components/contacts/contact-create-modal";
import { ContactImportModal } from "@/components/contacts/contact-import-modal";
import { ContactExportModal } from "@/components/contacts/contact-export-modal";
import { ContactFilterDrawer, ContactFilterState } from "@/components/contacts/contact-filter-drawer";
import { SegmentBuilderDialog, SegmentRule } from "@/components/segments/segment-builder-dialog";

export default function ContactsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Data Queries
    const { data: stats, isLoading: isStatsLoading } = useCustomerStats();

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<ContactFilterState>({});
    const [sortBy, setSortBy] = useState("last_updated");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter params sent to backend query
    const queryParams = useMemo(() => ({
        search: searchTerm || undefined,
        city: filters.city || undefined,
        stage: filters.stage || undefined,
        whatsapp_opt_in: filters.whatsapp_opt_in || undefined,
        last_interaction: filters.last_interaction || undefined,
        created_within: filters.created_within || undefined,
        company: filters.company || undefined,
        sort_by: sortBy,
    }), [searchTerm, filters, sortBy]);

    const { data: rawCustomers, isLoading: isCustomersLoading } = useListCustomers(queryParams);

    // Active customer list
    const customers = useMemo(() => {
        if (!rawCustomers || !Array.isArray(rawCustomers)) return [];
        return rawCustomers;
    }, [rawCustomers]);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSegmentBuilderOpen, setIsSegmentBuilderOpen] = useState(false);
    const [segmentInitialRules, setSegmentInitialRules] = useState<SegmentRule[]>([]);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        email: "",
        city: "",
        company: "",
        stage: "new_lead",
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete Modals
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk Delete
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Table Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // CRM Panel State
    const [crmContact, setCrmContact] = useState<CrmContact | null>(null);
    const [isCrmOpen, setIsCrmOpen] = useState(false);
    const [stageOverrides, setStageOverrides] = useState<Record<number, StageKey>>({});
    const [attrsOverrides, setAttrsOverrides] = useState<Record<number, Record<string, string>>>({});

    // Bulk Stage Change State
    const [isBulkStageOpen, setIsBulkStageOpen] = useState(false);
    const [bulkNewStage, setBulkNewStage] = useState<string>("qualified");
    const [isUpdatingBulkStage, setIsUpdatingBulkStage] = useState(false);

    // Pagination calculations
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return customers.slice(start, start + rowsPerPage);
    }, [customers, currentPage, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(customers.length / rowsPerPage));

    // Selection Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(paginatedCustomers.map((c) => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((item) => item !== id));
        }
    };

    // Filter count
    const activeFiltersCount = useMemo(() => {
        return Object.values(filters).filter((v) => v && v !== "").length;
    }, [filters]);

    // Format phone display
    const formatPhoneNumber = (phone: string) => {
        const cleaned = (phone || "").replace(/\D/g, "");
        if (cleaned.startsWith("91") && cleaned.length >= 12) {
            return { flag: "🇮🇳", display: `+91 ${cleaned.substring(2)}` };
        }
        if (cleaned.startsWith("1") && cleaned.length >= 11) {
            return { flag: "🇺🇸", display: `+1 ${cleaned.substring(1)}` };
        }
        if (cleaned.startsWith("971")) {
            return { flag: "🇦🇪", display: `+971 ${cleaned.substring(3)}` };
        }
        if (cleaned.startsWith("44")) {
            return { flag: "🇬🇧", display: `+44 ${cleaned.substring(2)}` };
        }
        return { flag: "📞", display: phone || "—" };
    };

    // Save active filters as Reusable Segment
    const handleSaveFilterAsSegment = (activeFilt?: ContactFilterState) => {
        const f = activeFilt || filters;
        const rules: SegmentRule[] = [];

        if (f.city) {
            rules.push({ field: "city", operator: "equals", value: f.city });
        }
        if (f.stage) {
            rules.push({ field: "lead_status", operator: "equals", value: f.stage });
        }
        if (f.whatsapp_opt_in) {
            rules.push({
                field: "whatsapp_opt_in",
                operator: "equals",
                value: f.whatsapp_opt_in === "true" ? "true" : "false",
            });
        }
        if (f.last_interaction) {
            rules.push({ field: "last_interaction", operator: "older_than_days", value: f.last_interaction });
        }
        if (f.company) {
            rules.push({ field: "company", operator: "equals", value: f.company });
        }
        if (f.created_within) {
            rules.push({ field: "created_at", operator: "within_days", value: f.created_within });
        }

        setSegmentInitialRules(rules);
        setIsSegmentBuilderOpen(true);
    };

    // Open Edit Dialog
    const handleOpenEdit = (customer: Customer) => {
        setCustomerToEdit(customer);
        setEditForm({
            name: customer.name || "",
            phone: customer.phone || "",
            email: customer.email || "",
            city: customer.city || "",
            company: customer.company || "",
            stage: (customer as any).stage || "new_lead",
        });
        setIsEditOpen(true);
    };

    // Execute Edit Contact
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerToEdit) return;

        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/customers/${customerToEdit.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Id": "8",
                },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.message || "Failed to update contact.");
                return;
            }

            toast.success("Contact updated successfully.");
            setIsEditOpen(false);
            setCustomerToEdit(null);
            queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
            queryClient.invalidateQueries({ queryKey: ["customerStats"] });
        } catch (err: any) {
            toast.error(err.message || "Network error while updating contact.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    // Delete Single Contact
    const handleConfirmDelete = async () => {
        if (!customerToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/customers/${customerToDelete.id}`, {
                method: "DELETE",
                headers: { "X-Tenant-Id": "8" },
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.message || "Failed to delete contact.");
                return;
            }

            toast.success(data.message || "Contact deleted successfully.");
            setIsDeleteOpen(false);
            setCustomerToDelete(null);
            setSelectedIds((prev) => prev.filter((id) => id !== customerToDelete.id));
            queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
            queryClient.invalidateQueries({ queryKey: ["customerStats"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to delete contact.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Bulk Delete
    const handleConfirmBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch("/api/customers/bulk-delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Id": "8",
                },
                body: JSON.stringify({ ids: selectedIds }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.message || "Failed to delete contacts.");
                return;
            }

            toast.success(data.message || `Deleted ${selectedIds.length} contacts.`);
            setIsBulkDeleteOpen(false);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
            queryClient.invalidateQueries({ queryKey: ["customerStats"] });
        } catch (err: any) {
            toast.error(err.message || "Error deleting selected contacts.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Bulk Stage Change
    const handleConfirmBulkStage = async () => {
        if (selectedIds.length === 0) return;

        setIsUpdatingBulkStage(true);
        try {
            const res = await fetch("/api/customers/bulk-update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Id": "8",
                },
                body: JSON.stringify({ ids: selectedIds, stage: bulkNewStage }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.message || "Failed to update stage.");
                return;
            }

            toast.success(`Updated lead stage for ${selectedIds.length} contacts.`);
            setIsBulkStageOpen(false);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
        } catch (err: any) {
            toast.error(err.message || "Error updating contacts stage.");
        } finally {
            setIsUpdatingBulkStage(false);
        }
    };

    // Open CRM Drawer
    const handleOpenCrm = (customer: Customer) => {
        const c: CrmContact = {
            id: customer.id,
            name: customer.name || "WhatsApp User",
            phone: customer.phone,
            city: customer.city ?? undefined,
            stage: (stageOverrides[customer.id] ?? (customer as any).stage ?? "new_lead") as StageKey,
            custom_attributes: attrsOverrides[customer.id] ?? (customer as any).custom_attributes ?? {},
            createdAt: customer.createdAt,
            messageCount: (customer as any).messageCount,
        };
        setCrmContact(c);
        setIsCrmOpen(true);
    };

    return (
        <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-16">
            {/* 1. Header with primary actions */}
            <PageHeader
                icon={Users}
                title="Contacts"
                badge={customers.length.toString()}
                description="Manage your customers, organize audiences, and target the right people."
                breadcrumbs={[{ label: "Contacts" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsExportOpen(true)}
                            className="border-slate-200 text-slate-700 text-xs h-9 px-3.5 rounded-xl flex items-center gap-1.5 bg-white font-semibold hover:bg-slate-50 cursor-pointer shadow-xs"
                        >
                            <Download size={14} className="text-slate-600" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsImportOpen(true)}
                            className="border-slate-200 text-slate-700 text-xs h-9 px-3.5 rounded-xl flex items-center gap-1.5 bg-white font-semibold hover:bg-slate-50 cursor-pointer shadow-xs"
                        >
                            <Upload size={14} className="text-[#35877D]" />
                            Import Contacts
                        </Button>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-[#35877D] hover:bg-[#2d736a] text-white text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 border-0 font-semibold cursor-pointer shadow-sm"
                        >
                            <Plus size={15} />
                            Add Contact
                        </Button>
                    </div>
                }
            />

            {/* 2. Lightweight KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white hover:border-[#35877D]/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Total Contacts
                            </div>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {isStatsLoading ? <Skeleton className="h-6 w-16" /> : (stats?.total ?? customers.length).toLocaleString()}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                            <Users size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white hover:border-[#35877D]/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
                                WhatsApp Opt-in
                            </div>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {isStatsLoading ? <Skeleton className="h-6 w-16" /> : (stats?.opted_in ?? 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center font-bold">
                            <ShieldCheck size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white hover:border-[#35877D]/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                                Active Contacts
                            </div>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {isStatsLoading ? <Skeleton className="h-6 w-16" /> : (stats?.active_30d ?? 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <CheckCircle2 size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white hover:border-[#35877D]/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                                New This Month
                            </div>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {isStatsLoading ? <Skeleton className="h-6 w-16" /> : (stats?.new_this_month ?? 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                            <Calendar size={18} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Filter Toolbar & Search Bar */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <Input
                                placeholder="Search by name, phone, city, or company..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 text-xs h-9 bg-slate-50/60 border-slate-200 rounded-xl focus:bg-white transition-colors"
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

                        {/* Filter Drawer Trigger */}
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterOpen(true)}
                            className={`h-9 text-xs px-3.5 rounded-xl border-slate-200 flex items-center gap-1.5 font-semibold transition-all ${
                                activeFiltersCount > 0
                                    ? "bg-[#35877D]/10 border-[#35877D] text-[#35877D]"
                                    : "bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            <SlidersHorizontal size={14} />
                            Filter
                            {activeFiltersCount > 0 && (
                                <span className="bg-[#35877D] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        {/* Sort selector */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span className="hidden md:inline">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                            >
                                <option value="last_updated">Recently Updated</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="phone">Phone Number</option>
                                <option value="created_at">Date Created</option>
                            </select>
                        </div>

                        {/* Page Size */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span className="hidden md:inline">Show:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
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

                {/* 4. Active Filters Bar with "Save as Segment" CTA */}
                {(activeFiltersCount > 0 || searchTerm) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-teal-50/40 p-2.5 px-4 rounded-xl border border-teal-100 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                                Active Filters:
                            </span>

                            {searchTerm && (
                                <Badge className="bg-white border-teal-200 text-teal-900 text-xs font-semibold gap-1 pl-2.5 pr-1.5 py-0.5 shadow-2xs">
                                    Search: &quot;{searchTerm}&quot;
                                    <button onClick={() => setSearchTerm("")} className="hover:text-rose-600">
                                        <X size={12} />
                                    </button>
                                </Badge>
                            )}

                            {filters.city && (
                                <Badge className="bg-white border-teal-200 text-teal-900 text-xs font-semibold gap-1 pl-2.5 pr-1.5 py-0.5 shadow-2xs">
                                    City: {filters.city}
                                    <button onClick={() => setFilters((prev) => ({ ...prev, city: "" }))} className="hover:text-rose-600">
                                        <X size={12} />
                                    </button>
                                </Badge>
                            )}

                            {filters.stage && (
                                <Badge className="bg-white border-teal-200 text-teal-900 text-xs font-semibold gap-1 pl-2.5 pr-1.5 py-0.5 shadow-2xs">
                                    Stage: {filters.stage}
                                    <button onClick={() => setFilters((prev) => ({ ...prev, stage: "" }))} className="hover:text-rose-600">
                                        <X size={12} />
                                    </button>
                                </Badge>
                            )}

                            {filters.whatsapp_opt_in && (
                                <Badge className="bg-white border-teal-200 text-teal-900 text-xs font-semibold gap-1 pl-2.5 pr-1.5 py-0.5 shadow-2xs">
                                    WhatsApp: {filters.whatsapp_opt_in === "true" ? "Opted In" : "Opted Out"}
                                    <button onClick={() => setFilters((prev) => ({ ...prev, whatsapp_opt_in: "" }))} className="hover:text-rose-600">
                                        <X size={12} />
                                    </button>
                                </Badge>
                            )}

                            {filters.last_interaction && (
                                <Badge className="bg-white border-teal-200 text-teal-900 text-xs font-semibold gap-1 pl-2.5 pr-1.5 py-0.5 shadow-2xs">
                                    Interaction: {filters.last_interaction}d
                                    <button onClick={() => setFilters((prev) => ({ ...prev, last_interaction: "" }))} className="hover:text-rose-600">
                                        <X size={12} />
                                    </button>
                                </Badge>
                            )}

                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilters({});
                                }}
                                className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer font-medium"
                            >
                                Clear all
                            </button>
                        </div>

                        {/* Save as Segment CTA Button */}
                        <Button
                            size="sm"
                            onClick={() => handleSaveFilterAsSegment()}
                            className="bg-[#35877D] hover:bg-[#2d736a] text-white text-xs h-7 px-3 rounded-lg font-bold gap-1.5 shadow-sm"
                        >
                            <BookmarkPlus size={13} />
                            Save as Segment ({customers.length})
                        </Button>
                    </div>
                )}
            </div>

            {/* 5. Contacts Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-3.5 pl-4 w-10">
                                    <Checkbox
                                        checked={
                                            paginatedCustomers.length > 0 &&
                                            paginatedCustomers.every((c) => selectedIds.includes(c.id))
                                        }
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                    />
                                </th>
                                <th className="p-3.5">Contact Details</th>
                                <th className="p-3.5">WhatsApp Opt-in</th>
                                <th className="p-3.5">CRM Stage</th>
                                <th className="p-3.5">Location & Company</th>
                                <th className="p-3.5">Created</th>
                                <th className="p-3.5 pr-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isCustomersLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3.5 pl-4"><Skeleton className="h-4 w-4" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-32" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-20" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-16" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-3.5"><Skeleton className="h-4 w-16" /></td>
                                        <td className="p-3.5 pr-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : paginatedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#35877D] flex items-center justify-center font-bold">
                                                <Users size={24} />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                {searchTerm || activeFiltersCount > 0
                                                    ? "No contacts match these filters"
                                                    : "No contacts yet"}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {searchTerm || activeFiltersCount > 0
                                                    ? "Try clearing your search query or adjusting your filter criteria."
                                                    : "Import your customer spreadsheet or create your first contact to start building audiences."}
                                            </p>
                                            <div className="flex items-center gap-2 pt-2">
                                                {searchTerm || activeFiltersCount > 0 ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSearchTerm("");
                                                            setFilters({});
                                                        }}
                                                        className="text-xs font-semibold"
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setIsImportOpen(true)}
                                                            className="text-xs font-semibold gap-1.5"
                                                        >
                                                            <Upload size={13} /> Import Contacts
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setIsCreateOpen(true)}
                                                            className="bg-[#35877D] hover:bg-[#2d736a] text-white text-xs font-semibold gap-1.5"
                                                        >
                                                            <Plus size={13} /> Add Contact
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedCustomers.map((customer) => {
                                    const phoneFormatted = formatPhoneNumber(customer.phone);
                                    const isSelected = selectedIds.includes(customer.id);
                                    const optIn = (customer as any).whatsapp_opt_in ?? true;
                                    const stage = (stageOverrides[customer.id] ?? (customer as any).stage ?? "new_lead") as StageKey;

                                    return (
                                        <tr
                                            key={customer.id}
                                            className={`hover:bg-slate-50/70 transition-colors ${
                                                isSelected ? "bg-teal-50/20" : ""
                                            }`}
                                        >
                                            <td className="p-3.5 pl-4">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelectRow(customer.id, !!checked)}
                                                />
                                            </td>

                                            {/* Contact Details */}
                                            <td className="p-3.5">
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/contacts/${customer.id}`}
                                                        className="font-bold text-slate-900 hover:text-[#35877D] hover:underline transition-colors text-xs flex items-center gap-1.5"
                                                    >
                                                        <span>{customer.name || "WhatsApp User"}</span>
                                                    </Link>
                                                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                                        <span>{phoneFormatted.flag}</span>
                                                        <span>{phoneFormatted.display}</span>
                                                    </div>
                                                    {customer.email && (
                                                        <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                                            {customer.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* WhatsApp Opt-in */}
                                            <td className="p-3.5">
                                                {optIn ? (
                                                    <Badge className="bg-teal-50 border-teal-200 text-teal-800 text-[10px] font-semibold gap-1 py-0.5">
                                                        <ShieldCheck size={11} className="text-[#35877D]" />
                                                        Opted-in
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px]">
                                                        Opted-out
                                                    </Badge>
                                                )}
                                                {(customer as any).last_interaction_at && (
                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                        Active {new Date((customer as any).last_interaction_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>

                                            {/* CRM Stage */}
                                            <td className="p-3.5">
                                                <div
                                                    onClick={() => handleOpenCrm(customer)}
                                                    className="cursor-pointer inline-block"
                                                    title="Click to manage CRM stage"
                                                >
                                                    <StageBadge stage={stage} />
                                                </div>
                                            </td>

                                            {/* Location & Company */}
                                            <td className="p-3.5 text-slate-600">
                                                <div className="space-y-0.5">
                                                    {customer.city ? (
                                                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                                                            <MapPin size={11} className="text-slate-400" />
                                                            {customer.city}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-[11px]">—</span>
                                                    )}
                                                    {(customer as any).company && (
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                            <Building2 size={10} className="text-slate-400" />
                                                            {(customer as any).company}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Created */}
                                            <td className="p-3.5 text-slate-400 text-[11px]">
                                                {customer.createdAt
                                                    ? new Date(customer.createdAt).toLocaleDateString()
                                                    : "—"}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-3.5 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={`/inbox?phone=${customer.phone}`}
                                                        className="h-7 w-7 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#35877D] flex items-center justify-center transition-colors"
                                                        title="Start WhatsApp Conversation"
                                                    >
                                                        <MessageCircle size={13} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleOpenEdit(customer)}
                                                        className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                                                        title="Edit Contact"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setCustomerToDelete(customer);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="h-7 w-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                                                        title="Delete Contact"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Pagination */}
                <div className="p-3.5 px-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <div>
                        Showing <strong>{paginatedCustomers.length}</strong> of <strong>{customers.length}</strong> contacts
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="h-7 text-xs px-2.5 rounded-lg font-semibold"
                        >
                            Previous
                        </Button>
                        <span className="text-[11px] font-bold text-slate-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="h-7 text-xs px-2.5 rounded-lg font-semibold"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* 6. Floating Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 pr-3 border-r border-slate-700 text-xs">
                        <span className="w-5 h-5 rounded-full bg-[#35877D] text-white flex items-center justify-center text-[10px] font-bold">
                            {selectedIds.length}
                        </span>
                        <span className="font-semibold">Selected</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsBulkStageOpen(true)}
                            className="h-8 text-xs bg-slate-800 border-slate-700 text-white hover:bg-slate-700 font-semibold"
                        >
                            Change Stage
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsExportOpen(true)}
                            className="h-8 text-xs bg-slate-800 border-slate-700 text-white hover:bg-slate-700 font-semibold gap-1"
                        >
                            <Download size={13} />
                            Export
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => router.push(`/marketing/campaigns/new`)}
                            className="h-8 text-xs bg-[#35877D] hover:bg-[#2d736a] text-white font-bold gap-1 shadow-sm"
                        >
                            <Send size={13} />
                            Send Campaign
                        </Button>

                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setIsBulkDeleteOpen(true)}
                            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 font-semibold gap-1"
                        >
                            <Trash2 size={13} />
                            Delete
                        </Button>

                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-slate-400 hover:text-white text-xs pl-2 underline"
                        >
                            Deselect
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 1: Contact Create Modal */}
            <ContactCreateModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onContactCreated={() => {
                    queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
                    queryClient.invalidateQueries({ queryKey: ["customerStats"] });
                }}
            />

            {/* MODAL 2: Guided Contact Import Modal */}
            <ContactImportModal
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                onImportSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
                    queryClient.invalidateQueries({ queryKey: ["customerStats"] });
                }}
            />

            {/* MODAL 3: Contact Export Modal */}
            <ContactExportModal
                open={isExportOpen}
                onOpenChange={setIsExportOpen}
                totalCount={customers.length}
                selectedCount={selectedIds.length}
                selectedIds={selectedIds}
                activeFiltersCount={activeFiltersCount}
                searchQuery={searchTerm}
            />

            {/* DRAWER 4: Filter Drawer */}
            <ContactFilterDrawer
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                filters={filters}
                onApplyFilters={(f) => {
                    setFilters(f);
                    setCurrentPage(1);
                }}
                onResetFilters={() => {
                    setFilters({});
                    setCurrentPage(1);
                }}
                onSaveAsSegment={(f) => handleSaveFilterAsSegment(f)}
                matchingCount={customers.length}
            />

            {/* DIALOG 5: Segment Builder Dialog (pre-filled from filters) */}
            <SegmentBuilderDialog
                open={isSegmentBuilderOpen}
                onOpenChange={setIsSegmentBuilderOpen}
                token={null}
                initialRules={segmentInitialRules}
                onSaveSuccess={() => {
                    toast.success("Segment saved successfully! You can find it in your Audience Library.");
                    setIsSegmentBuilderOpen(false);
                }}
            />

            {/* DIALOG 6: Edit Contact Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl border-slate-200">
                    <DialogHeader className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100">
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Edit2 size={16} className="text-[#35877D]" />
                            Edit Contact Details
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Update profile information for {customerToEdit?.name || "this contact"}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                                className="text-xs h-9"
                                placeholder="e.g. Rohan Mehta"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                            <Input
                                value={editForm.phone}
                                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                                className="text-xs h-9"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">City</Label>
                                <Input
                                    value={editForm.city}
                                    onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                                    className="text-xs h-9"
                                    placeholder="e.g. Ahmedabad"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Company</Label>
                                <Input
                                    value={editForm.company}
                                    onChange={(e) => setEditForm((p) => ({ ...p, company: e.target.value }))}
                                    className="text-xs h-9"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                            <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                                className="text-xs h-9"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Lead Stage</Label>
                            <select
                                value={editForm.stage}
                                onChange={(e) => setEditForm((p) => ({ ...p, stage: e.target.value }))}
                                className="w-full text-xs h-9 border border-slate-200 rounded-lg px-2.5 bg-white text-slate-800"
                            >
                                {Object.entries(STAGES).map(([key, info]) => (
                                    <option key={key} value={key}>
                                        {info.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditOpen(false)}
                                className="h-9 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSavingEdit}
                                className="bg-[#35877D] hover:bg-[#2d736a] text-white h-9 text-xs font-semibold gap-1.5"
                            >
                                {isSavingEdit && <Loader2 size={14} className="animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG 7: Single Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl border-slate-200">
                    <div className="bg-rose-50 border-b border-rose-100 p-6 pb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                            <Trash2 size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Delete Contact
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                This will permanently remove this customer from your database.
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-6 space-y-3 text-xs text-slate-600">
                        {customerToDelete && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 text-sm">{customerToDelete.name || "WhatsApp User"}</div>
                                <div className="text-slate-500 font-mono">{customerToDelete.phone}</div>
                            </div>
                        )}
                        <p className="text-[11px] text-slate-500">
                            Deleting this contact will also clean up associated custom attributes and conversation references.
                        </p>
                    </div>

                    <DialogFooter className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDeleteOpen(false)}
                            className="h-9 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs font-semibold gap-1.5 shadow-sm"
                        >
                            {isDeleting && <Loader2 size={14} className="animate-spin" />}
                            Delete Contact
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG 8: Bulk Delete Confirmation */}
            <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl border-slate-200">
                    <div className="bg-rose-50 border-b border-rose-100 p-6 pb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                            <Trash2 size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Bulk Delete {selectedIds.length} Contacts
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Permanent action across selected customer records.
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-6 space-y-3 text-xs text-slate-600">
                        <p>
                            Are you sure you want to permanently delete <strong>{selectedIds.length}</strong> selected contacts?
                        </p>
                        <p className="text-[11px] text-slate-500">
                            This action cannot be undone. All related customer data will be deleted.
                        </p>
                    </div>

                    <DialogFooter className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsBulkDeleteOpen(false)}
                            className="h-9 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isBulkDeleting}
                            onClick={handleConfirmBulkDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs font-semibold gap-1.5 shadow-sm"
                        >
                            {isBulkDeleting && <Loader2 size={14} className="animate-spin" />}
                            Delete {selectedIds.length} Contacts
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG 9: Bulk Stage Change */}
            <Dialog open={isBulkStageOpen} onOpenChange={setIsBulkStageOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl border-slate-200">
                    <DialogHeader className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100">
                        <DialogTitle className="text-base font-bold text-slate-900">
                            Update Lead Stage
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Change pipeline stage for {selectedIds.length} selected contacts.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Select New Stage</Label>
                            <select
                                value={bulkNewStage}
                                onChange={(e) => setBulkNewStage(e.target.value)}
                                className="w-full text-xs h-9 border border-slate-200 rounded-lg px-2.5 bg-white text-slate-800 font-medium"
                            >
                                {Object.entries(STAGES).map(([key, info]) => (
                                    <option key={key} value={key}>
                                        {info.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <DialogFooter className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsBulkStageOpen(false)}
                            className="h-9 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isUpdatingBulkStage}
                            onClick={handleConfirmBulkStage}
                            className="bg-[#35877D] hover:bg-[#2d736a] text-white h-9 text-xs font-semibold gap-1.5 shadow-sm"
                        >
                            {isUpdatingBulkStage && <Loader2 size={14} className="animate-spin" />}
                            Apply to {selectedIds.length} Contacts
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SLIDE-OVER CRM PANEL */}
            <ContactCrmPanel
                contact={crmContact}
                isOpen={isCrmOpen}
                onClose={() => setIsCrmOpen(false)}
                onStageChange={(id, stage) => {
                    setStageOverrides((prev) => ({ ...prev, [id]: stage }));
                    setCrmContact((prev) => (prev && prev.id === id ? { ...prev, stage } : prev));
                }}
                onAttributesChange={(id, attrs) => {
                    setAttrsOverrides((prev) => ({ ...prev, [id]: attrs }));
                    setCrmContact((prev) => (prev && prev.id === id ? { ...prev, custom_attributes: attrs } : prev));
                }}
            />
        </div>
    );
}
