"use client";

import React from "react";
import { User, Phone, Mail, Building, Plus, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactMessageBubbleProps {
    contactData?: any;
    messageText?: string;
    isInbound: boolean;
}

export function ContactMessageBubble({ contactData, messageText, isInbound }: ContactMessageBubbleProps) {
    const { toast } = useToast();

    // Normalizing contact data which can come as an array, object, or JSON string
    let parsedData = contactData;
    if (typeof parsedData === "string") {
        try {
            parsedData = JSON.parse(parsedData);
        } catch {
            // keep as is
        }
    }
    if (parsedData && typeof parsedData === "object" && parsedData.contacts) {
        parsedData = parsedData.contacts;
    }

    const contact = Array.isArray(parsedData) ? parsedData[0] : (parsedData && typeof parsedData === "object" ? parsedData : {});

    // Try extracting name from message text if available (e.g. "Contact: Rahul Sharma", "Contact Card: Rahul Sharma", "Rahul Sharma")
    const cleanedMessageName = messageText
        ? messageText.replace(/^(contact card|contact):\s*/i, "").trim()
        : "";

    // Candidate names in priority order
    const candidateName =
        contact?.name?.formatted_name ||
        (typeof contact?.name === "string" ? contact.name : null) ||
        `${contact?.name?.first_name || ""} ${contact?.name?.last_name || ""}`.trim() ||
        contact?.formatted_name ||
        contact?.displayName ||
        contact?.full_name ||
        contact?.first_name ||
        (cleanedMessageName && !/^contact(\s*card)?$/i.test(cleanedMessageName) ? cleanedMessageName : null);

    const name = candidateName || "Contact";

    const phone =
        contact?.phones?.[0]?.phone ||
        contact?.phones?.[0]?.wa_id ||
        (contact?.phones && typeof contact.phones[0] === "string" ? contact.phones[0] : "") ||
        contact?.phone ||
        contact?.wa_id ||
        "";

    const email =
        contact?.emails?.[0]?.email ||
        (contact?.emails && typeof contact.emails[0] === "string" ? contact.emails[0] : "") ||
        contact?.email ||
        "";
    const company = contact?.org?.company || contact?.organization || "";

    const handleCopyPhone = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (phone && typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(phone);
            toast({
                title: "Phone Copied",
                description: `${phone} copied to clipboard`,
            });
        }
    };

    return (
        <div className="overflow-hidden rounded-xl bg-white border border-slate-200/90 shadow-2xs max-w-[280px] sm:max-w-[320px]">
            <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#2F8F83]/15 text-[#2F8F83] flex items-center justify-center font-bold text-sm shrink-0">
                    <User size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{name}</h4>
                    {company && (
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <Building size={10} />
                            <span>{company}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="p-3 space-y-2 text-xs">
                {phone && (
                    <div className="flex items-center justify-between gap-2 text-slate-700">
                        <div className="flex items-center gap-2 truncate">
                            <Phone size={13} className="text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px] truncate">{phone}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyPhone}
                            className="text-[10px] font-semibold text-[#2F8F83] hover:underline shrink-0 cursor-pointer"
                        >
                            Copy
                        </button>
                    </div>
                )}

                {email && (
                    <div className="flex items-center gap-2 text-slate-700 truncate">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] truncate text-slate-600">{email}</span>
                    </div>
                )}

                <div className="pt-1">
                    <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                    >
                        <Plus size={13} />
                        <span>Save Contact</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
