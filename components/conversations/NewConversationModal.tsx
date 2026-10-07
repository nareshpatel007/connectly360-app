"use client";

import React, { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    useListCustomers,
    useListTemplates,
    useCreateConversation,
    useGetWindowStatus,
    type Customer,
    type WhatsAppTemplateItem,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
    Search,
    User,
    UserPlus,
    Phone,
    MessageSquare,
    FileText,
    Send,
    Loader2,
    ShieldAlert,
    CheckCircle2,
    Sparkles,
} from "lucide-react";

interface NewConversationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConversationCreated: (customerId: number) => void;
}

export function NewConversationModal({
    open,
    onOpenChange,
    onConversationCreated,
}: NewConversationModalProps) {
    const { toast } = useToast();
    const [tab, setTab] = useState<"search" | "create">("search");

    // Search contacts state
    const [searchContact, setSearchContact] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Create new contact state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    // Message composer state
    const [messageType, setMessageType] = useState<"text" | "template">("text");
    const [textMessage, setTextMessage] = useState("");
    const [selectedTemplateName, setSelectedTemplateName] = useState("");
    const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

    // API Hooks
    const { data: customers = [], isLoading: isLoadingCustomers } = useListCustomers({
        search: searchContact,
    });
    const { data: templates = [], isLoading: isLoadingTemplates } = useListTemplates();
    const createConversation = useCreateConversation();

    // Check window status for selected contact
    const { data: windowStatus } = useGetWindowStatus(selectedCustomer?.id);

    // Approved templates only
    const approvedTemplates = useMemo(() => {
        return (templates || []).filter(
            (t) => !t.status || t.status.toLowerCase() === "approved"
        );
    }, [templates]);

    // Selected template entity
    const activeTemplate = useMemo(() => {
        return approvedTemplates.find((t) => t.name === selectedTemplateName);
    }, [approvedTemplates, selectedTemplateName]);

    // Extract placeholders from template body: {{1}}, {{2}}, etc.
    const variablePlaceholders = useMemo(() => {
        if (!activeTemplate?.body_text) return [];
        const matches = activeTemplate.body_text.match(/\{\{\d+\}\}/g);
        return matches ? Array.from(new Set(matches)) : [];
    }, [activeTemplate]);

    // Check if WhatsApp requires a template:
    // If brand new contact (tab === 'create') OR contact has no recent inbound message in 24h
    const requiresTemplate = useMemo(() => {
        if (tab === "create") return true;
        if (!selectedCustomer) return false;
        return windowStatus?.requires_template ?? true;
    }, [tab, selectedCustomer, windowStatus]);

    // Handle template variable change
    const handleVarChange = (ph: string, val: string) => {
        setTemplateVariables((prev) => ({ ...prev, [ph]: val }));
    };

    // Replace preview placeholders with real values
    const renderedTemplateBody = useMemo(() => {
        if (!activeTemplate?.body_text) return "";
        let body = activeTemplate.body_text;
        Object.entries(templateVariables).forEach(([ph, val]) => {
            if (val) {
                body = body.split(ph).join(val);
            }
        });
        return body;
    }, [activeTemplate, templateVariables]);

    // Reset modal fields
    const handleReset = () => {
        setSelectedCustomer(null);
        setSearchContact("");
        setFirstName("");
        setLastName("");
        setPhone("");
        setEmail("");
        setTextMessage("");
        setSelectedTemplateName("");
        setTemplateVariables({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        let targetPhone = "";
        let targetCustomerId: number | undefined = undefined;

        if (tab === "search") {
            if (!selectedCustomer) {
                toast({ title: "Select a Contact", description: "Please choose an existing contact to start the chat.", variant: "destructive" });
                return;
            }
            targetCustomerId = selectedCustomer.id;
            targetPhone = selectedCustomer.phone;
        } else {
            if (!phone.trim()) {
                toast({ title: "Phone number required", description: "Please enter the customer phone number with country code.", variant: "destructive" });
                return;
            }
            targetPhone = phone.trim();
        }

        const isTemplate = requiresTemplate || messageType === "template";

        if (isTemplate) {
            if (!selectedTemplateName) {
                toast({ title: "Template Required", description: "Please select an approved WhatsApp template to initiate.", variant: "destructive" });
                return;
            }

            // Build components parameters
            const paramValues = variablePlaceholders.map((ph) => ({
                type: "text",
                text: templateVariables[ph] || "",
            }));

            const components = paramValues.length > 0 ? [
                {
                    type: "body",
                    parameters: paramValues,
                }
            ] : [];

            try {
                const res = await createConversation.mutateAsync({
                    customer_id: targetCustomerId,
                    phone: targetPhone,
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    type: "template",
                    template_name: selectedTemplateName,
                    language: activeTemplate?.language || "en",
                    components,
                });

                toast({
                    title: "Conversation Started",
                    description: `Template "${selectedTemplateName}" sent to ${targetPhone}.`,
                });

                const cid = res?.data?.customer?.id || targetCustomerId;
                if (cid) onConversationCreated(cid);
                onOpenChange(false);
                handleReset();
            } catch (err: any) {
                toast({
                    title: "Could not send template",
                    description: err.message || "Failed to initiate conversation.",
                    variant: "destructive",
                });
            }
        } else {
            if (!textMessage.trim()) {
                toast({ title: "Message required", description: "Please enter your message text.", variant: "destructive" });
                return;
            }

            try {
                const res = await createConversation.mutateAsync({
                    customer_id: targetCustomerId,
                    phone: targetPhone,
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    type: "text",
                    message: textMessage.trim(),
                });

                toast({
                    title: "Conversation Started",
                    description: `Message sent successfully to ${targetPhone}.`,
                });

                const cid = res?.data?.customer?.id || targetCustomerId;
                if (cid) onConversationCreated(cid);
                onOpenChange(false);
                handleReset();
            } catch (err: any) {
                toast({
                    title: "Could not send message",
                    description: err.message || "Failed to initiate conversation.",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) handleReset(); }}>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 border-slate-200">
                <DialogHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-2xl bg-[#378179]/10 text-[#378179] flex items-center justify-center font-bold">
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-extrabold text-slate-800">
                                New Conversation
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Select or register a customer contact and dispatch initial WhatsApp communication.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Step 1: Customer Selection */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Step 1: Choose Contact
                        </Label>

                        <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelectedCustomer(null); }}>
                            <TabsList className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl h-9">
                                <TabsTrigger value="search" className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#378179] data-[state=active]:shadow-xs">
                                    <User size={13} className="mr-1.5" />
                                    Existing Contact
                                </TabsTrigger>
                                <TabsTrigger value="create" className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#378179] data-[state=active]:shadow-xs">
                                    <UserPlus size={13} className="mr-1.5" />
                                    Create New Contact
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Existing Contact Search */}
                            <TabsContent value="search" className="space-y-3 pt-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search by contact name or phone number..."
                                        value={searchContact}
                                        onChange={(e) => setSearchContact(e.target.value)}
                                        className="pl-8 text-xs h-9 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                                    />
                                </div>

                                {selectedCustomer ? (
                                    <div className="p-3 bg-[#f2faf7] border border-[#378179]/30 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-[#378179] text-white flex items-center justify-center font-bold text-xs">
                                                {selectedCustomer.name?.charAt(0).toUpperCase() || "C"}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{selectedCustomer.name}</p>
                                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                                    <Phone size={10} /> +{selectedCustomer.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCustomer(null)}
                                            className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-7 px-2.5"
                                        >
                                            Change
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                                        {isLoadingCustomers ? (
                                            <div className="p-4 text-center text-xs text-slate-400">Loading contacts...</div>
                                        ) : customers.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-400">
                                                No contacts matched. Switch to "Create New Contact" tab.
                                            </div>
                                        ) : (
                                            customers.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => setSelectedCustomer(c)}
                                                    className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {c.name?.charAt(0).toUpperCase() || "C"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                                                            <p className="text-[10px] text-slate-400">+{c.phone}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] text-[#378179] border-[#378179]/20">
                                                        Select
                                                    </Badge>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Tab 2: Create Contact */}
                            <TabsContent value="create" className="space-y-3 pt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-slate-600">First Name</Label>
                                        <Input
                                            placeholder="e.g. Rahul"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="text-xs h-9 rounded-xl bg-slate-50 border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-slate-600">Last Name</Label>
                                        <Input
                                            placeholder="e.g. Sharma"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="text-xs h-9 rounded-xl bg-slate-50 border-slate-200"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-slate-600">Phone Number (with Country Code)*</Label>
                                        <Input
                                            placeholder="e.g. 919876543210"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="text-xs h-9 rounded-xl bg-slate-50 border-slate-200"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-slate-600">Email (Optional)</Label>
                                        <Input
                                            type="email"
                                            placeholder="rahul@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="text-xs h-9 rounded-xl bg-slate-50 border-slate-200"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Step 2: WhatsApp Policy & Message Composition */}
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Step 2: Message & WhatsApp Policy
                        </Label>

                        {/* WhatsApp Policy Banner */}
                        {requiresTemplate ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-800 text-xs leading-relaxed">
                                <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">WhatsApp 24-Hour Policy Notice:</span>{" "}
                                    To initiate a new conversation or contact outside the 24-hour service window, Meta requires sending an approved WhatsApp template.
                                </div>
                            </div>
                        ) : (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={15} className="text-emerald-600" />
                                    <span>Inside 24-Hour Active Window. Free-form text allowed.</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setMessageType("text")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${messageType === "text" ? "bg-emerald-600 text-white" : "bg-emerald-100/60 text-emerald-800"}`}
                                    >
                                        Free-form
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMessageType("template")}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${messageType === "template" ? "bg-emerald-600 text-white" : "bg-emerald-100/60 text-emerald-800"}`}
                                    >
                                        Template
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Template Selection & Preview */}
                        {requiresTemplate || messageType === "template" ? (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-slate-600">Select Approved Template*</Label>
                                    <select
                                        value={selectedTemplateName}
                                        onChange={(e) => setSelectedTemplateName(e.target.value)}
                                        className="w-full text-xs h-9.5 px-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 font-medium"
                                        required
                                    >
                                        <option value="">-- Choose an approved WhatsApp template --</option>
                                        {approvedTemplates.map((t) => (
                                            <option key={t.name} value={t.name}>
                                                {t.name} ({t.language.toUpperCase()}) - {t.category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {activeTemplate && (
                                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                                <FileText size={12} className="text-[#378179]" />
                                                Template Preview
                                            </span>
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                Meta Approved
                                            </Badge>
                                        </div>

                                        {/* Dynamic variable inputs */}
                                        {variablePlaceholders.length > 0 && (
                                            <div className="space-y-2 pt-1 border-t border-slate-200/60">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    Template Parameters
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {variablePlaceholders.map((ph, idx) => (
                                                        <div key={ph} className="space-y-0.5">
                                                            <Label className="text-[10px] font-semibold text-slate-600">
                                                                Parameter {idx + 1} ({ph})
                                                            </Label>
                                                            <Input
                                                                size={1}
                                                                placeholder={`Value for ${ph}`}
                                                                value={templateVariables[ph] || ""}
                                                                onChange={(e) => handleVarChange(ph, e.target.value)}
                                                                className="text-xs h-8 rounded-lg bg-white border-slate-200"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rendered WhatsApp Preview Bubble */}
                                        <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 shadow-2xs whitespace-pre-wrap">
                                            {renderedTemplateBody}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Free-form text input */
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-slate-600">Message Content*</Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Type your message to the customer..."
                                    value={textMessage}
                                    onChange={(e) => setTextMessage(e.target.value)}
                                    className="text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white resize-none"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="text-[11px] text-slate-400">
                            Deducts 1 WhatsApp credit on dispatch
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => { onOpenChange(false); handleReset(); }}
                                className="text-xs rounded-xl h-9 px-4"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                size="sm"
                                disabled={createConversation.isPending}
                                className="bg-[#378179] hover:bg-[#2b625c] text-white font-bold text-xs rounded-xl h-9 px-5 flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                {createConversation.isPending ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Dispatching...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={13} />
                                        <span>Send &amp; Open Chat</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
