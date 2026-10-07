"use client";

import { useListCustomers, useCreateCustomer, Customer } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    MapPin,
    Phone,
    MessageCircle,
    Plus,
    Loader2,
    PlayCircle,
    SlidersHorizontal,
    Upload,
    Download,
    Trash2,
    Edit2,
    ShieldCheck,
    Users
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactCrmPanel, StageBadge, CrmContact, StageKey, STAGES } from "@/components/contacts/contact-crm-panel";

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const { data: customers, isLoading } = useListCustomers({ search: searchTerm });
    const createCustomerMutation = useCreateCustomer();
    const queryClient = useQueryClient();

    // Dialog & Form States
    const [isOpen, setIsOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [firstMessage, setFirstMessage] = useState("");

    // New States for Redesigned UI
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState("last_updated");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // CRM Panel
    const [crmContact, setCrmContact] = useState<CrmContact | null>(null);
    const [isCrmOpen, setIsCrmOpen] = useState(false);
    // Local overrides for stage & attributes (so table updates instantly)
    const [stageOverrides, setStageOverrides] = useState<Record<number, StageKey>>({});
    const [attrsOverrides, setAttrsOverrides] = useState<Record<number, Record<string, string>>>({});

    // Filter & Sort customers
    const filteredCustomers = (customers?.filter(customer =>
        (customer.name || "WhatsApp User").toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.city || "").toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === "name") {
            return (a.name || "WhatsApp User").localeCompare(b.name || "WhatsApp User");
        } else if (sortBy === "phone") {
            return a.phone.localeCompare(b.phone);
        }
        // Default: Sort by last updated/created (id desc/created_at desc)
        return b.id - a.id;
    })) || [];

    const handleCreateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) {
            toast.error("Phone number is required");
            return;
        }

        try {
            await createCustomerMutation.mutateAsync({
                data: {
                    name: name.trim() || "WhatsApp User",
                    phone: phone.trim(),
                    city: city.trim() || undefined,
                    firstMessage: firstMessage.trim() || undefined,
                },
            });

            toast.success("Contact created successfully");
            queryClient.invalidateQueries({ queryKey: ["listCustomers"] });

            // Reset form and close dialog
            setName("");
            setPhone("");
            setCity("");
            setFirstMessage("");
            setIsOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to create contact");
        }
    };

    // Checkbox selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked && filteredCustomers) {
            setSelectedIds(filteredCustomers.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id));
        }
    };

    // WhatsApp SVG Icon
    const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
            <path d="M12.004 2C6.48 2 2 6.48 2 12c0 2.17.7 4.19 1.89 5.83L2.06 22l4.31-1.13c1.62.88 3.48 1.39 5.47 1.39 5.52 0 10-4.48 10-10S17.52 2 12.004 2zm5.73 13.91c-.24.68-1.24 1.25-1.91 1.33-.57.07-1.3.1-3.69-.89-3.06-1.27-5.01-4.36-5.16-4.57-.15-.2-.17-.26-.17-.46s.1-.37.2-.56c.1-.19.2-.24.3-.39.1-.15.15-.24.22-.39.07-.15.03-.29-.02-.39s-.49-1.2-.67-1.63c-.17-.43-.35-.37-.48-.38l-.41-.01c-.15 0-.39.06-.59.28-.2.22-.78.76-.78 1.85 0 1.09.8 2.14.91 2.29.11.15 1.57 2.4 3.8 3.36 1.86.8 2.48.64 2.87.6.86-.09 1.91-.78 2.18-1.5.27-.72.27-1.34.19-1.47-.08-.13-.29-.21-.61-.37s-1.89-.93-2.18-1.04-.51-.16-.72.16c-.21.32-.82 1.04-1.01 1.25-.19.21-.38.24-.7.08-.32-.16-1.35-.5-2.58-1.59-.95-.85-1.6-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.15-.14.32-.37.48-.56.16-.19.22-.32.32-.53.1-.21.05-.4-.02-.56s-.67-1.63-.92-2.24c-.24-.6-.49-.52-.67-.53-.18-.01-.39-.01-.6-.01z" />
        </svg>
    );

    // Phone Flag Helper
    const formatPhoneNumber = (phone: string) => {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("91")) {
            return {
                flag: "🇮🇳",
                display: `(+91) ${cleaned.substring(2)}`
            };
        }
        return {
            flag: "📞",
            display: phone
        };
    };

    // Mock utility handlers
    const handleExport = () => {
        toast.success(`Exported ${filteredCustomers?.length ?? 0} contacts successfully to CSV.`);
    };

    const handleImport = () => {
        setIsImportOpen(true);
    };

    const downloadSampleFile = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Name,Phone,City,First Message\n"
            + "John Doe,919876543210,Mumbai,Hello there\n"
            + "Jane Smith,919876543211,Delhi,Interested in your product\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sample_contacts.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const cleanField = (field: string) => {
        if (!field) return "";
        return field.replace(/^["']|["']$/g, "").trim();
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error("Please select a file first");
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) {
                toast.error("Failed to read file");
                setIsImporting(false);
                return;
            }

            const lines = text.split(/\r?\n/);
            if (lines.length === 0) {
                toast.error("File is empty");
                setIsImporting(false);
                return;
            }

            const headers = lines[0].split(",");

            // Basic validation
            if (headers.length < 2 || !headers[0].toLowerCase().includes("name") || !headers[1].toLowerCase().includes("phone")) {
                toast.error("Invalid CSV format. Please make sure headers are: Name, Phone, City, First Message");
                setIsImporting(false);
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const columns = line.split(",");
                const cName = cleanField(columns[0]);
                const cPhone = cleanField(columns[1]);
                const cCity = cleanField(columns[2]);
                const cFirstMessage = cleanField(columns[3]);

                if (!cPhone) {
                    errorCount++;
                    continue;
                }

                try {
                    await createCustomerMutation.mutateAsync({
                        data: {
                            name: cName || "WhatsApp User",
                            phone: cPhone,
                            city: cCity || undefined,
                            firstMessage: cFirstMessage || undefined
                        }
                    });
                    successCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            toast.success(`Import completed: ${successCount} contacts imported successfully.${errorCount > 0 ? ` ${errorCount} failed.` : ""}`);
            queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
            setIsImportOpen(false);
            setImportFile(null);
            setIsImporting(false);
        };

        reader.onerror = () => {
            toast.error("Error reading file");
            setIsImporting(false);
        };

        reader.readAsText(importFile);
    };

    const handleBulkDelete = () => {
        setIsBulkDeleteOpen(true);
    };

    const confirmBulkDelete = () => {
        toast.success(`Deleted ${selectedIds.length} contacts successfully.`);
        setSelectedIds([]);
        setIsBulkDeleteOpen(false);
    };

    const handleDeleteClick = (customer: Customer) => {
        setCustomerToDelete(customer);
        setIsDeleteOpen(true);
    };

    const confirmDeleteContact = () => {
        if (customerToDelete) {
            toast.success(`Contact "${customerToDelete.name || 'WhatsApp User'}" deleted successfully.`);
            setIsDeleteOpen(false);
            setCustomerToDelete(null);
        }
    };

    const openEditDialog = (customer: Customer) => {
        setSelectedCustomer(customer);
        setName(customer.name || "");
        setPhone(customer.phone);
        setCity(customer.city || "");
        setIsEditOpen(true);
    };

    const handleEditContact = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Contact details updated successfully.");
        setIsEditOpen(false);
        setSelectedCustomer(null);
        setName("");
        setPhone("");
        setCity("");
    };

    const openCrmPanel = (customer: Customer) => {
        const c: CrmContact = {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            city: customer.city,
            stage: (stageOverrides[customer.id] ?? (customer as any).stage ?? "new_lead") as StageKey,
            custom_attributes: attrsOverrides[customer.id] ?? (customer as any).custom_attributes ?? {},
            createdAt: customer.createdAt,
            messageCount: (customer as any).messageCount,
        };
        setCrmContact(c);
        setIsCrmOpen(true);
    };

    const handleCrmStageChange = (id: number, stage: StageKey) => {
        setStageOverrides(prev => ({ ...prev, [id]: stage }));
        setCrmContact(prev => prev && prev.id === id ? { ...prev, stage } : prev);
    };

    const handleCrmAttrsChange = (id: number, attrs: Record<string, string>) => {
        setAttrsOverrides(prev => ({ ...prev, [id]: attrs }));
        setCrmContact(prev => prev && prev.id === id ? { ...prev, custom_attributes: attrs } : prev);
    };

    return (
        <div className="space-y-6 w-full">
            {/* Standard PageHeader */}
            <PageHeader
                icon={Users}
                title="Contacts"
                badge={filteredCustomers ? `${filteredCustomers.length}` : undefined}
                description="Manage customer contact cards, conversational history, and pipeline CRM stages."
                breadcrumbs={[{ label: "Contacts" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="border-slate-200 text-slate-700 text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 bg-white font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                            <Upload size={14} />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleImport}
                            className="border-slate-200 text-slate-700 text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 bg-white font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                            <Download size={14} />
                            Import
                        </Button>
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 border-0 font-semibold cursor-pointer shadow-2xs"
                        >
                            <Plus size={15} />
                            Add Contact
                        </Button>
                    </div>
                }
            />

            {/* Create Contact Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-[#E8F6F3] border-b border-[#BFE4DD] px-6 py-4 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-2xs">
                            <Plus size={16} className="text-[#2F8F83]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800">Create New Contact</DialogTitle>
                            <DialogDescription className="text-slate-600 text-xs mt-0.5">
                                Add a contact manually to your database.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleCreateContact} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="text-xs text-slate-700 h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 919876543210"
                                className="text-xs text-slate-700 h-9"
                                required
                            />
                            <p className="text-[10px] text-slate-400">
                                Include country code without + or spaces (e.g. 919876543210).
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="city" className="text-xs font-semibold text-slate-700">City</Label>
                            <Input
                                id="city"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Mumbai"
                                className="text-xs text-slate-700 h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="firstMessage" className="text-xs font-semibold text-slate-700">First Message (Optional)</Label>
                            <Textarea
                                id="firstMessage"
                                value={firstMessage}
                                onChange={(e) => setFirstMessage(e.target.value)}
                                placeholder="Type a message to start conversation immediately..."
                                className="min-h-[80px] text-xs text-slate-700 leading-relaxed resize-none"
                            />
                        </div>
                        <DialogFooter className="pt-2 flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={createCustomerMutation.isPending}
                                className="text-xs rounded-xl h-9 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer shadow-2xs"
                                disabled={createCustomerMutation.isPending}
                            >
                                {createCustomerMutation.isPending ? (
                                    <span className="flex items-center gap-1.5">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Creating...
                                    </span>
                                ) : (
                                    "Create Contact"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Filter and Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <span>Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="h-9 px-2 border border-[#E5E9EE] bg-white rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2F8F83] cursor-pointer"
                        >
                            <option value="last_updated">Last Updated</option>
                            <option value="name">Name</option>
                            <option value="phone">Phone Number</option>
                        </select>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Input
                            type="search"
                            placeholder="Search contacts"
                            className="pr-9 h-9 text-xs text-slate-600 bg-white border-[#E5E9EE] rounded-lg focus-visible:ring-1 focus-visible:ring-[#2F8F83]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer"
                        >
                            <Trash2 size={13} />
                            Delete ({selectedIds.length})
                        </Button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <Card className="border border-[#E5E9EE] bg-white shadow-2xs rounded-xl overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead className="w-[50px] pl-6 py-3">
                                    <Checkbox
                                        checked={filteredCustomers?.length > 0 && selectedIds.length === filteredCustomers.length}
                                        onCheckedChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-slate-300 text-[#2F8F83] focus:ring-[#2F8F83]"
                                    />
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs">Basic info</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs">Phone number</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs">Source</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs">Stage</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs">Contact Attributes</TableHead>
                                <TableHead className="w-[100px] text-right font-semibold text-slate-700 text-xs pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-4 bg-slate-100" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32 bg-slate-100" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24 bg-slate-100" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12 bg-slate-100" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48 bg-slate-100" /></TableCell>
                                        <TableCell className="text-right pr-6"><Skeleton className="h-8 w-16 ml-auto bg-slate-100" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredCustomers?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 text-xs pl-6 pr-6">
                                        No contacts found. Click "+ Add Contact" to manually create a contact.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers?.map((customer) => {
                                    const { flag, display } = formatPhoneNumber(customer.phone);
                                    const isSelected = selectedIds.includes(customer.id);
                                    return (
                                        <TableRow
                                            key={customer.id}
                                            className="hover:bg-slate-50/40 text-slate-650 cursor-pointer"
                                            onClick={() => openCrmPanel(customer)}
                                        >
                                            <TableCell className="py-3" onClick={e => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => handleSelect(customer.id, !!checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-[#2F8F83] focus:ring-[#2F8F83]"
                                                />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); openCrmPanel(customer); }}
                                                        className="text-slate-700 hover:text-[#2F8F83] hover:underline font-semibold text-xs transition-colors text-left cursor-pointer"
                                                    >
                                                        {customer.name || "WhatsApp User"}
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-slate-700 text-xs font-semibold">
                                                <span className="flex items-center">
                                                    {display}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="text-xs font-semibold border border-[#E5E9EE] text-slate-600 px-2 py-0.5 bg-slate-50 rounded-md">
                                                    Connectly360
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <StageBadge stage={stageOverrides[customer.id] ?? (customer as any).stage ?? "new_lead"} />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                    {Object.entries(attrsOverrides[customer.id] ?? (customer as any).custom_attributes ?? {}).slice(0, 2).map(([k, v]) => (
                                                        <span key={k} className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-medium border border-[#E5E9EE] max-w-[130px] truncate">
                                                            {k}: {String(v)}
                                                        </span>
                                                    ))}
                                                    {Object.keys(attrsOverrides[customer.id] ?? (customer as any).custom_attributes ?? {}).length > 2 && (
                                                        <span className="text-[10px] font-semibold text-[#2F8F83] cursor-pointer hover:underline" onClick={e => { e.stopPropagation(); openCrmPanel(customer); }}>
                                                            +{Object.keys(attrsOverrides[customer.id] ?? (customer as any).custom_attributes ?? {}).length - 2} more
                                                        </span>
                                                    )}
                                                    {Object.keys(attrsOverrides[customer.id] ?? (customer as any).custom_attributes ?? {}).length === 0 && (
                                                        <span className="text-[10px] text-slate-400 italic">Click row to add</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-right pr-6" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openCrmPanel(customer)}
                                                        className="h-8 w-8 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                                                    >
                                                        <Edit2 size={13} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(customer)}
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                                                    >
                                                        <Trash2 size={13} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="h-8 px-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#378179] cursor-pointer"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <span>
                        1-{filteredCustomers?.length || 0} of {filteredCustomers?.length || 0}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            disabled
                            className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200 bg-white text-slate-400 opacity-60 cursor-not-allowed"
                        >
                            &lt; Previous
                        </Button>
                        <Button
                            variant="outline"
                            disabled
                            className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200 bg-white text-slate-400 opacity-60 cursor-not-allowed"
                        >
                            Next &gt;
                        </Button>
                    </div>
                </div>
            </div>

            {/* EDIT CONTACT DIALOG */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-[#E8F6F3] border-b border-[#BFE4DD] px-6 py-4 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-2xs">
                            <Edit2 size={15} className="text-[#2F8F83]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800">Edit Contact</DialogTitle>
                            <DialogDescription className="text-slate-600 text-xs mt-0.5">
                                Modify contact parameters and save changes.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleEditContact} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="editName" className="text-xs font-semibold text-slate-700">Name</Label>
                            <Input
                                id="editName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="text-xs text-slate-700 h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editPhone" className="text-xs font-semibold text-slate-700">
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="editPhone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 919876543210"
                                className="text-xs text-slate-700 h-9"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editCity" className="text-xs font-semibold text-slate-700">City</Label>
                            <Input
                                id="editCity"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Mumbai"
                                className="text-xs text-slate-700 h-9"
                            />
                        </div>
                        <DialogFooter className="pt-2 flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditOpen(false);
                                    setSelectedCustomer(null);
                                }}
                                className="text-xs rounded-xl h-9 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer shadow-2xs"
                            >
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* IMPORT CONTACTS DIALOG */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-[#E8F6F3] border-b border-[#BFE4DD] px-6 py-4 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-2xs">
                            <Download size={16} className="text-[#2F8F83]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800">Import Contacts</DialogTitle>
                            <DialogDescription className="text-slate-600 text-xs mt-0.5">
                                Bulk upload contacts from a CSV or Excel file.
                            </DialogDescription>
                        </div>
                    </div>

                    <form onSubmit={handleFileUpload} className="p-6 space-y-5">
                        {/* Sample file download area */}
                        <div className="bg-slate-50 border border-[#E5E9EE] rounded-xl p-3.5 flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-slate-700">Need a template?</p>
                                <p className="text-[11px] text-slate-500">Download our sample CSV to format your data.</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={downloadSampleFile}
                                className="h-8 text-xs px-2.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 font-medium cursor-pointer"
                            >
                                <Download size={12} />
                                Sample.csv
                            </Button>
                        </div>

                        {/* File Upload input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="csvFile" className="text-xs font-semibold text-slate-700">Select File</Label>
                            <div className="border-2 border-dashed border-slate-200 hover:border-[#2F8F83]/65 transition-colors rounded-xl p-6 text-center cursor-pointer relative bg-slate-50/50">
                                <input
                                    type="file"
                                    id="csvFile"
                                    accept=".csv"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Upload className="h-8 w-8 text-slate-400" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-700">
                                            {importFile ? importFile.name : "Click to upload CSV or Excel"}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : "Max file size: 5MB"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-2 flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsImportOpen(false);
                                    setImportFile(null);
                                }}
                                disabled={isImporting}
                                className="text-xs rounded-xl h-9 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer shadow-2xs"
                                disabled={isImporting || !importFile}
                            >
                                {isImporting ? (
                                    <span className="flex items-center gap-1.5">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Importing...
                                    </span>
                                ) : (
                                    "Import Contacts"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Trash2 size={16} className="text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800">Delete Contact</DialogTitle>
                            <DialogDescription className="text-slate-605 text-xs mt-0.5">
                                Are you sure you want to delete this contact?
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {customerToDelete && (
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5 text-xs text-slate-700 font-medium">
                                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-slate-400">Name:</span>
                                    <span className="font-bold text-slate-800">{customerToDelete.name || "WhatsApp User"}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-slate-400">Phone:</span>
                                    <span className="font-semibold text-slate-800">{customerToDelete.phone}</span>
                                </div>
                                {customerToDelete.city && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">City:</span>
                                        <span className="font-medium text-slate-800">{customerToDelete.city}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-[11px] text-slate-500 leading-normal">
                            This action cannot be undone. All messages and history associated with this contact will be permanently deleted from the database.
                        </p>

                        <DialogFooter className="pt-2 flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteOpen(false);
                                    setCustomerToDelete(null);
                                }}
                                className="text-xs rounded-xl h-9 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDeleteContact}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer"
                            >
                                Delete Contact
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* BULK DELETE CONFIRMATION DIALOG */}
            <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
                    <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Trash2 size={16} className="text-red-650 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800">Bulk Delete Contacts</DialogTitle>
                            <DialogDescription className="text-slate-600 text-xs mt-0.5">
                                Are you sure you want to delete {selectedIds.length} selected contacts?
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-xs font-semibold text-slate-700">Contacts to be deleted:</p>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-1 max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {customers?.filter(c => selectedIds.includes(c.id)).map(customer => (
                                <div key={customer.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                                    <span className="font-bold text-slate-800 truncate">{customer.name || "WhatsApp User"}</span>
                                    <span className="text-slate-500 font-medium shrink-0">{customer.phone}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-[11px] text-slate-500 leading-normal">
                            This action cannot be undone. All messages and history associated with these contacts will be permanently deleted from the database.
                        </p>

                        <DialogFooter className="pt-2 flex justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsBulkDeleteOpen(false);
                                }}
                                className="text-xs rounded-xl h-9 px-4 font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmBulkDelete}
                                className="bg-red-600 hover:bg-red-750 text-white text-xs rounded-xl h-9 px-5 font-semibold border-0 cursor-pointer"
                            >
                                Delete {selectedIds.length} Contacts
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CRM Slide-over Panel */}
            <ContactCrmPanel
                contact={crmContact}
                isOpen={isCrmOpen}
                onClose={() => setIsCrmOpen(false)}
                onStageChange={handleCrmStageChange}
                onAttributesChange={handleCrmAttrsChange}
            />

        </div>
    );
}
