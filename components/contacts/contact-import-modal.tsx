"use client";

import React, { useState, useRef } from "react";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
    Download,
    X,
    Loader2,
    RefreshCw,
    Users
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ContactImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token?: string | null;
    onImportSuccess: () => void;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "complete";

const TARGET_FIELDS = [
    { key: "phone", label: "Phone Number *", required: true, description: "Must include country code (e.g. 919825012345)" },
    { key: "name", label: "Full Name", required: false, description: "e.g. Rahul Sharma" },
    { key: "first_name", label: "First Name", required: false, description: "First name only" },
    { key: "last_name", label: "Last Name", required: false, description: "Last name only" },
    { key: "email", label: "Email Address", required: false, description: "Valid email format" },
    { key: "city", label: "City", required: false, description: "e.g. Ahmedabad, Mumbai" },
    { key: "state", label: "State", required: false, description: "e.g. Gujarat, Maharashtra" },
    { key: "company", label: "Company", required: false, description: "Organization name" },
    { key: "stage", label: "Lead Stage", required: false, description: "new_lead, qualified, won, lost" },
    { key: "whatsapp_opt_in", label: "WhatsApp Opt-in", required: false, description: "Yes / No / True / False" },
];

export function ContactImportModal({
    open,
    onOpenChange,
    token,
    onImportSuccess
}: ContactImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<Step>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
    const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [duplicateStrategy, setDuplicateStrategy] = useState<"update" | "skip">("update");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importResult, setImportResult] = useState<{
        total_rows: number;
        imported_count: number;
        updated_count: number;
        skipped_count: number;
        invalid_count: number;
        errors: { row: number; phone: string; reason: string }[];
    } | null>(null);

    const resetState = () => {
        setStep("upload");
        setFile(null);
        setParsedHeaders([]);
        setParsedRows([]);
        setColumnMapping({});
        setDuplicateStrategy("update");
        setIsSubmitting(false);
        setImportResult(null);
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".txt")) {
            toast.error("Please upload a CSV file (.csv)");
            return;
        }

        setFile(selectedFile);
        parseCSV(selectedFile);
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) {
                toast.error("Empty file selected.");
                return;
            }

            const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
            if (lines.length < 2) {
                toast.error("CSV file must contain at least a header row and one contact row.");
                return;
            }

            // Simple CSV parser supporting quotes
            const parseLine = (line: string): string[] => {
                const values: string[] = [];
                let current = "";
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"' || char === "'") {
                        inQuotes = !inQuotes;
                    } else if (char === "," && !inQuotes) {
                        values.push(current.trim());
                        current = "";
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim());
                return values.map((v) => v.replace(/^["']|["']$/g, "").trim());
            };

            const headers = parseLine(lines[0]);
            setParsedHeaders(headers);

            const rows: Record<string, string>[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = parseLine(lines[i]);
                const rowObj: Record<string, string> = {};
                headers.forEach((h, idx) => {
                    rowObj[h] = values[idx] || "";
                });
                rows.push(rowObj);
            }
            setParsedRows(rows);

            // Auto-detect mappings
            const mapping: Record<string, string> = {};
            headers.forEach((h) => {
                const lower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
                if (lower.includes("phone") || lower.includes("mobile") || lower.includes("whatsapp") || lower === "tel") {
                    mapping[h] = "phone";
                } else if (lower === "name" || lower === "fullname" || lower === "customername" || lower === "contactname") {
                    mapping[h] = "name";
                } else if (lower === "firstname") {
                    mapping[h] = "first_name";
                } else if (lower === "lastname") {
                    mapping[h] = "last_name";
                } else if (lower.includes("email") || lower === "mail") {
                    mapping[h] = "email";
                } else if (lower.includes("city") || lower === "town") {
                    mapping[h] = "city";
                } else if (lower.includes("state") || lower === "province") {
                    mapping[h] = "state";
                } else if (lower.includes("company") || lower.includes("organization") || lower.includes("business")) {
                    mapping[h] = "company";
                } else if (lower.includes("stage") || lower.includes("status") || lower.includes("leadstage")) {
                    mapping[h] = "stage";
                } else if (lower.includes("optin") || lower.includes("permission") || lower.includes("consent")) {
                    mapping[h] = "whatsapp_opt_in";
                }
            });
            setColumnMapping(mapping);
            setStep("mapping");
        };
        reader.readAsText(file);
    };

    const downloadSampleCSV = () => {
        const sampleContent =
            "Full Name,Phone Number,Email,City,State,Company,Lead Stage,WhatsApp Opt-in\n" +
            "Rohan Mehta,919825012345,rohan@example.com,Ahmedabad,Gujarat,Mehta Traders,qualified,Yes\n" +
            "Priya Patel,919898011223,priya@example.com,Mumbai,Maharashtra,Patel Enterprises,won,Yes\n" +
            "Amit Shah,919712033445,amit@example.com,Surat,Gujarat,Shah Tech,new_lead,Yes\n";

        const blob = new Blob([sampleContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "connectly360_sample_contacts.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate validation counts based on current mapping
    const getValidationStats = () => {
        const phoneCol = Object.keys(columnMapping).find((col) => columnMapping[col] === "phone");
        if (!phoneCol) return { valid: 0, invalid: parsedRows.length, hasPhone: false };

        let valid = 0;
        let invalid = 0;

        parsedRows.forEach((r) => {
            const raw = r[phoneCol] || "";
            const clean = raw.replace(/[^0-9]/g, "");
            if (clean.length >= 10 && clean.length <= 15) {
                valid++;
            } else {
                invalid++;
            }
        });

        return { valid, invalid, hasPhone: true };
    };

    const handleExecuteImport = async () => {
        const phoneCol = Object.keys(columnMapping).find((col) => columnMapping[col] === "phone");
        if (!phoneCol) {
            toast.error("You must map at least one column to 'Phone Number *'");
            return;
        }

        setIsSubmitting(true);
        setStep("importing");

        try {
            // Build transformed contact rows based on column mappings
            const formattedContacts = parsedRows.map((row) => {
                const contact: Record<string, any> = {};
                Object.entries(columnMapping).forEach(([fileCol, targetKey]) => {
                    if (targetKey && targetKey !== "skip") {
                        contact[targetKey] = row[fileCol];
                    }
                });
                return contact;
            });

            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            headers["X-Tenant-Id"] = "8";

            const res = await fetch("/api/customers/import", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    contacts: formattedContacts,
                    duplicate_strategy: duplicateStrategy,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.message || "Failed to import contacts.");
                setStep("preview");
                return;
            }

            setImportResult(data.data);
            setStep("complete");
            toast.success(data.message);
            onImportSuccess();
        } catch (err: any) {
            toast.error(err.message || "Network error while importing.");
            setStep("preview");
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = getValidationStats();

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!isSubmitting) {
                    onOpenChange(v);
                    if (!v) resetState();
                }
            }}
        >
            <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden bg-white rounded-2xl border-slate-200">
                <DialogHeader className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center font-bold">
                                <Upload size={20} />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-900">
                                    Import Contacts
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    Upload and sync customer numbers into your audience database.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {/* Stepper tracker */}
                    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-200/60 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${step === "upload" ? "bg-[#35877D] text-white" : "bg-slate-200 text-slate-600"}`}>
                            1. Upload
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${step === "mapping" ? "bg-[#35877D] text-white" : "bg-slate-200 text-slate-600"}`}>
                            2. Map Columns
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${step === "preview" ? "bg-[#35877D] text-white" : "bg-slate-200 text-slate-600"}`}>
                            3. Validate & Options
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${step === "complete" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                            4. Done
                        </span>
                    </div>
                </DialogHeader>

                <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {/* STEP 1: UPLOAD */}
                    {step === "upload" && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between p-3.5 bg-teal-50/50 rounded-xl border border-teal-100">
                                <div>
                                    <h4 className="text-xs font-bold text-teal-900">Need a template?</h4>
                                    <p className="text-[11px] text-teal-700">Download our pre-formatted CSV template with standard fields.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadSampleCSV}
                                    className="bg-white border-teal-200 text-teal-800 hover:bg-teal-50 h-8 text-xs font-semibold gap-1.5 shadow-sm"
                                >
                                    <Download size={14} />
                                    Sample CSV
                                </Button>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 hover:border-[#35877D] transition-colors rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/40 hover:bg-teal-50/20 text-center"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    className="hidden"
                                    onChange={handleFileSelected}
                                />
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-[#35877D] flex items-center justify-center mb-3">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 mb-1">
                                    Click to upload CSV file
                                </h3>
                                <p className="text-xs text-slate-500 mb-3">
                                    Supports .CSV files up to 5MB (thousands of contacts)
                                </p>
                                <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-600">
                                    E.164 phone formats automatically recognized
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: COLUMN MAPPING */}
                    {step === "mapping" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">Map your CSV columns</h4>
                                    <p className="text-[11px] text-slate-500">
                                        Matched {parsedHeaders.length} columns from <strong>{file?.name}</strong> ({parsedRows.length} rows found)
                                    </p>
                                </div>
                                <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[11px]">
                                    {parsedRows.length} Contacts
                                </Badge>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                <div className="grid grid-cols-2 bg-slate-50 px-3.5 py-2 text-[11px] font-bold text-slate-600">
                                    <div>YOUR FILE HEADER</div>
                                    <div>CONNECTLY360 FIELD</div>
                                </div>
                                {parsedHeaders.map((header) => {
                                    const currentVal = columnMapping[header] || "skip";
                                    return (
                                        <div key={header} className="grid grid-cols-2 items-center px-3.5 py-2.5 gap-3 hover:bg-slate-50/60 transition-colors">
                                            <div className="text-xs font-medium text-slate-800 truncate" title={header}>
                                                {header}
                                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                                    e.g. &quot;{parsedRows[0]?.[header] || "—"}&quot;
                                                </div>
                                            </div>
                                            <div>
                                                <select
                                                    value={currentVal}
                                                    onChange={(e) => {
                                                        setColumnMapping((prev) => ({
                                                            ...prev,
                                                            [header]: e.target.value === "skip" ? "" : e.target.value,
                                                        }));
                                                    }}
                                                    className="w-full text-xs h-8 border border-slate-200 rounded-lg px-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                                >
                                                    <option value="skip">— Skip this column —</option>
                                                    {TARGET_FIELDS.map((f) => (
                                                        <option key={f.key} value={f.key}>
                                                            {f.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW & OPTIONS */}
                    {step === "preview" && (
                        <div className="space-y-5">
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">Validation Summary</h4>
                                <p className="text-[11px] text-slate-500">
                                    Reviewing {parsedRows.length} records ready for import.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Ready to Import</div>
                                    <div className="text-lg font-black text-emerald-900 mt-1">{stats.valid}</div>
                                    <div className="text-[10px] text-emerald-700">Valid phone numbers</div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Invalid Rows</div>
                                    <div className="text-lg font-black text-amber-900 mt-1">{stats.invalid}</div>
                                    <div className="text-[10px] text-amber-700">Missing/bad phone</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Total Rows</div>
                                    <div className="text-lg font-black text-slate-800 mt-1">{parsedRows.length}</div>
                                    <div className="text-[10px] text-slate-500">From uploaded file</div>
                                </div>
                            </div>

                            {!stats.hasPhone && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                                    <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Phone number column required:</strong> Go back to step 2 and map at least one column to <em>Phone Number *</em>.
                                    </div>
                                </div>
                            )}

                            {/* Duplicate Policy */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <Label className="text-xs font-bold text-slate-800">
                                    When a phone number already exists:
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label
                                        className={`border rounded-xl p-3 cursor-pointer flex flex-col gap-1 transition-all ${
                                            duplicateStrategy === "update"
                                                ? "border-[#35877D] bg-teal-50/40 text-slate-900"
                                                : "border-slate-200 hover:border-slate-300 text-slate-600"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold">Update existing</span>
                                            <input
                                                type="radio"
                                                name="dup_strategy"
                                                checked={duplicateStrategy === "update"}
                                                onChange={() => setDuplicateStrategy("update")}
                                                className="accent-[#35877D]"
                                            />
                                        </div>
                                        <span className="text-[11px] text-slate-500">
                                            Keep existing history and update missing attributes.
                                        </span>
                                    </label>

                                    <label
                                        className={`border rounded-xl p-3 cursor-pointer flex flex-col gap-1 transition-all ${
                                            duplicateStrategy === "skip"
                                                ? "border-[#35877D] bg-teal-50/40 text-slate-900"
                                                : "border-slate-200 hover:border-slate-300 text-slate-600"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold">Skip duplicate</span>
                                            <input
                                                type="radio"
                                                name="dup_strategy"
                                                checked={duplicateStrategy === "skip"}
                                                onChange={() => setDuplicateStrategy("skip")}
                                                className="accent-[#35877D]"
                                            />
                                        </div>
                                        <span className="text-[11px] text-slate-500">
                                            Ignore duplicate rows and only insert new customer numbers.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: IMPORTING */}
                    {step === "importing" && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                            <Loader2 size={36} className="animate-spin text-[#35877D]" />
                            <h3 className="text-sm font-bold text-slate-900">Importing your contacts...</h3>
                            <p className="text-xs text-slate-500 max-w-xs">
                                Normalizing phone numbers, checking opt-in preferences, and syncing audience database.
                            </p>
                        </div>
                    )}

                    {/* STEP 5: COMPLETE */}
                    {step === "complete" && importResult && (
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-emerald-950">Import Completed Successfully</h3>
                                    <p className="text-xs text-emerald-800">
                                        Your audience database has been updated with the latest customer records.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] text-slate-500 font-semibold">Total Rows</div>
                                    <div className="text-base font-bold text-slate-800 mt-0.5">{importResult.total_rows}</div>
                                </div>
                                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="text-[10px] text-emerald-700 font-semibold">Added New</div>
                                    <div className="text-base font-bold text-emerald-800 mt-0.5">{importResult.imported_count}</div>
                                </div>
                                <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100">
                                    <div className="text-[10px] text-teal-700 font-semibold">Updated</div>
                                    <div className="text-base font-bold text-teal-800 mt-0.5">{importResult.updated_count}</div>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] text-slate-500 font-semibold">Skipped / Bad</div>
                                    <div className="text-base font-bold text-slate-700 mt-0.5">{importResult.skipped_count + importResult.invalid_count}</div>
                                </div>
                            </div>

                            {importResult.errors && importResult.errors.length > 0 && (
                                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3 text-xs">
                                    <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                                        <AlertTriangle size={14} />
                                        {importResult.errors.length} rows required attention:
                                    </div>
                                    <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-amber-800">
                                        {importResult.errors.map((err, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>Row #{err.row} ({err.phone || "No phone"})</span>
                                                <span className="font-medium text-amber-700">{err.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    {step === "upload" && (
                        <div className="w-full flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="h-9 text-xs"
                            >
                                Cancel
                            </Button>
                        </div>
                    )}

                    {step === "mapping" && (
                        <div className="w-full flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setStep("upload")}
                                className="h-9 text-xs gap-1"
                            >
                                <ArrowLeft size={14} /> Back
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    const hasPhone = Object.values(columnMapping).includes("phone");
                                    if (!hasPhone) {
                                        toast.error("Please map at least one column to Phone Number *");
                                        return;
                                    }
                                    setStep("preview");
                                }}
                                className="bg-[#35877D] hover:bg-[#2d736a] text-white h-9 text-xs font-semibold gap-1.5 shadow-sm"
                            >
                                Continue to Preview <ArrowRight size={14} />
                            </Button>
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="w-full flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setStep("mapping")}
                                className="h-9 text-xs gap-1"
                            >
                                <ArrowLeft size={14} /> Back
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={!stats.hasPhone || stats.valid === 0 || isSubmitting}
                                onClick={handleExecuteImport}
                                className="bg-[#35877D] hover:bg-[#2d736a] text-white h-9 text-xs font-semibold gap-1.5 shadow-sm"
                            >
                                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                                Start Import ({stats.valid} contacts)
                            </Button>
                        </div>
                    )}

                    {step === "complete" && (
                        <div className="w-full flex justify-end">
                            <Button
                                type="button"
                                onClick={() => {
                                    onOpenChange(false);
                                    resetState();
                                }}
                                className="bg-[#35877D] hover:bg-[#2d736a] text-white h-9 text-xs font-semibold shadow-sm"
                            >
                                View Contacts
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
