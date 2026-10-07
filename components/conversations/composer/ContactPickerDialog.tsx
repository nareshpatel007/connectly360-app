"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSendContact: (contacts: any[]) => void;
}

export function ContactPickerDialog({
    open,
    onOpenChange,
    onSendContact,
}: ContactPickerDialogProps) {
    const { toast } = useToast();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");

    const handleSend = () => {
        const cleanPhone = phone.replace(/[^0-9+]/g, "").trim();
        const formattedName = `${firstName.trim()} ${lastName.trim()}`.trim();

        if (!formattedName) {
            toast({
                title: "Name Required",
                description: "Please enter a contact name.",
                variant: "destructive",
            });
            return;
        }

        if (!cleanPhone) {
            toast({
                title: "Phone Required",
                description: "Please enter a valid phone number.",
                variant: "destructive",
            });
            return;
        }

        const contactPayload = [
            {
                name: {
                    formatted_name: formattedName,
                    first_name: firstName.trim() || undefined,
                    last_name: lastName.trim() || undefined,
                },
                phones: [
                    {
                        phone: cleanPhone,
                        type: "CELL",
                    },
                ],
                emails: email.trim()
                    ? [
                          {
                              email: email.trim(),
                              type: "WORK",
                          },
                      ]
                    : undefined,
                org: company.trim()
                    ? {
                          company: company.trim(),
                      }
                    : undefined,
            },
        ];

        onSendContact(contactPayload);
        onOpenChange(false);
        setFirstName("");
        setLastName("");
        setPhone("");
        setEmail("");
        setCompany("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-5 bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                        <User size={18} className="text-[#2F8F83]" />
                        <span>Share Contact Card</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">First Name *</Label>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Last Name</Label>
                            <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" />
                            <span>Phone Number (E.164 with country code) *</span>
                        </Label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+919876543210"
                            className="h-8 text-xs font-mono"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            <span>Email Address</span>
                        </Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john.doe@example.com"
                            className="h-8 text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Building size={12} className="text-slate-400" />
                            <span>Company / Organization</span>
                        </Label>
                        <Input
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="Acme Corp"
                            className="h-8 text-xs"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="h-8 text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSend}
                        disabled={!firstName.trim() || !phone.trim()}
                        className="h-8 text-xs bg-[#2F8F83] hover:bg-[#267A70] text-white"
                    >
                        Send Contact Card
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
