"use client";

import React, { useState } from "react";
import {
    Plus,
    Phone,
    User,
    Mail,
    Building,
    MapPin,
    ShieldCheck,
    MessageSquare,
    AlertCircle,
    Check,
    Loader2,
    Send,
    ExternalLink
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STAGES } from "@/components/contacts/contact-crm-panel";

interface ContactCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token?: string | null;
    onContactCreated: (contact: any) => void;
}

const COUNTRY_CODES = [
    { code: "91", flag: "🇮🇳", label: "India (+91)" },
    { code: "1", flag: "🇺🇸", label: "US / Canada (+1)" },
    { code: "44", flag: "🇬🇧", label: "UK (+44)" },
    { code: "971", flag: "🇦🇪", label: "UAE (+971)" },
    { code: "65", flag: "🇸🇬", label: "Singapore (+65)" },
    { code: "61", flag: "🇦🇺", label: "Australia (+61)" },
    { code: "49", flag: "🇩🇪", label: "Germany (+49)" },
    { code: "33", flag: "🇫🇷", label: "France (+33)" },
];

export function ContactCreateModal({
    open,
    onOpenChange,
    token,
    onContactCreated
}: ContactCreateModalProps) {
    const router = useRouter();

    // Form fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [countryCode, setCountryCode] = useState("91");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("India");
    const [stage, setStage] = useState("new_lead");
    const [source, setSource] = useState("Manual");
    const [whatsappOptIn, setWhatsappOptIn] = useState(true);
    const [firstMessage, setFirstMessage] = useState("");

    // State
    const [isSaving, setIsSaving] = useState(false);
    const [existingContactId, setExistingContactId] = useState<number | null>(null);
    const [existingErrorMsg, setExistingErrorMsg] = useState<string | null>(null);

    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
        setEmail("");
        setCompany("");
        setCity("");
        setState("");
        setCountry("India");
        setStage("new_lead");
        setSource("Manual");
        setWhatsappOptIn(true);
        setFirstMessage("");
        setExistingContactId(null);
        setExistingErrorMsg(null);
    };

    const handleSubmit = async (startConversation = false) => {
        const cleanDigits = phoneNumber.replace(/\D/g, "");
        if (!cleanDigits) {
            toast.error("Phone number is required");
            return;
        }

        // Prepend country code if not already included
        let fullPhone = cleanDigits;
        if (!cleanDigits.startsWith(countryCode) && cleanDigits.length === 10) {
            fullPhone = `${countryCode}${cleanDigits}`;
        }

        setIsSaving(true);
        setExistingContactId(null);
        setExistingErrorMsg(null);

        try {
            const fullName = trimName(firstName, lastName);

            const payload = {
                name: fullName || "WhatsApp User",
                first_name: firstName.trim() || undefined,
                last_name: lastName.trim() || undefined,
                phone: fullPhone,
                email: email.trim() || undefined,
                company: company.trim() || undefined,
                city: city.trim() || undefined,
                state: state.trim() || undefined,
                country: country.trim() || "India",
                stage,
                source,
                whatsapp_opt_in: whatsappOptIn,
                firstMessage: firstMessage.trim() || undefined,
            };

            const res = await fetch("/api/customers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.status === 409 || data.conflict) {
                setExistingContactId(data.existing_id || null);
                setExistingErrorMsg(data.message || "This WhatsApp number already exists.");
                toast.error(data.message || "This WhatsApp number already exists.");
                return;
            }

            if (res.ok && data.success) {
                toast.success("Contact created successfully");
                if (data.message_result?.status === "template_required") {
                    toast.info(data.message_result.message);
                }
                onContactCreated(data);
                resetForm();
                onOpenChange(false);

                if (startConversation && data.id) {
                    router.push(`/contacts/${data.id}`);
                }
            } else {
                toast.error(data.message || "Failed to create contact");
            }
        } catch (err: any) {
            toast.error(err.message || "Error creating contact");
        } finally {
            setIsSaving(false);
        }
    };

    const trimName = (first: string, last: string) => {
        return [first.trim(), last.trim()].filter(Boolean).join(" ");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 rounded-2xl bg-white border border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <User size={18} className="text-[#35877D]" />
                        <span>Create Contact</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Add a customer record to your central WhatsApp CRM database.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1 text-xs">
                    {/* Conflict Warning if phone duplicate */}
                    {existingErrorMsg && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-amber-800">
                                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                                <span className="font-semibold text-xs">{existingErrorMsg}</span>
                            </div>
                            {existingContactId && (
                                <Link
                                    href={`/contacts/${existingContactId}`}
                                    onClick={() => onOpenChange(false)}
                                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors"
                                >
                                    Open Contact <ExternalLink size={11} />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Section: Basic Information */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <User size={13} className="text-[#35877D]" />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">First Name</Label>
                                <Input
                                    placeholder="e.g. John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Last Name</Label>
                                <Input
                                    placeholder="e.g. Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                        </div>

                        {/* Phone Number with Country Code */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-900">
                                WhatsApp Phone Number *
                            </Label>
                            <div className="flex gap-2">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                >
                                    {COUNTRY_CODES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} +{c.code}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    type="tel"
                                    placeholder="98250 12345"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs flex-1 font-mono"
                                />
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                                Enter local 10-digit number. Country code will be formatted automatically.
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                                <Input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Company</Label>
                                <Input
                                    placeholder="e.g. Acme Industries"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Location */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#35877D]" />
                            Location
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">City</Label>
                                <Input
                                    placeholder="e.g. Ahmedabad"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">State / Province</Label>
                                <Input
                                    placeholder="e.g. Gujarat"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Country</Label>
                                <Input
                                    placeholder="India"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: CRM & WhatsApp Permission */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-[#35877D]" />
                            CRM & Compliance
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Lead Stage</Label>
                                <select
                                    value={stage}
                                    onChange={(e) => setStage(e.target.value)}
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                                >
                                    {STAGES.map((s) => (
                                        <option key={s.key} value={s.key}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Source</Label>
                                <Input
                                    placeholder="e.g. Website, Walk-in, Referral"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    className="h-9 rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                        </div>

                        {/* WhatsApp Marketing Permission Checkbox */}
                        <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 flex items-start gap-2.5">
                            <input
                                type="checkbox"
                                id="optin-toggle"
                                checked={whatsappOptIn}
                                onChange={(e) => setWhatsappOptIn(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded accent-[#35877D]"
                            />
                            <div>
                                <Label htmlFor="optin-toggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                                    WhatsApp Marketing Permission
                                </Label>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Contact explicitly opted-in to receive broadcast announcements and marketing updates.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: First Message (Optional with Advisory) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <MessageSquare size={13} className="text-[#35877D]" />
                            First Message (Optional)
                        </Label>
                        <Textarea
                            placeholder="Type a message to start conversation immediately..."
                            value={firstMessage}
                            onChange={(e) => setFirstMessage(e.target.value)}
                            rows={2}
                            className="text-xs rounded-xl border-slate-200 resize-none"
                        />
                        <p className="text-[11px] text-amber-700 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                            <strong>WhatsApp Policy Note:</strong> Initiating a new conversation with a contact requires an approved Meta template unless the user messaged your business in the last 24 hours.
                        </p>
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl text-xs font-semibold text-slate-500"
                    >
                        Cancel
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => handleSubmit(false)}
                            className="rounded-xl border-slate-200 text-xs font-bold text-slate-700"
                        >
                            {isSaving ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                            Save Contact
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => handleSubmit(true)}
                            className="rounded-xl bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs shadow-xs"
                        >
                            Save & Start Chat
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
