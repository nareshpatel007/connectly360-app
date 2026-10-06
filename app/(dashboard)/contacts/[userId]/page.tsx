"use client";

import { useGetCustomer, useGetCustomerConversations, useSendMessage } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, MapPin, Calendar, Send, Loader2, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CustomerDetailPage() {
    const params = useParams();
    const userId = params.userId as string;
    const customerId = userId ? parseInt(userId, 10) : 0;

    const queryClient = useQueryClient();
    const [messageText, setMessageText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: customer, isLoading: isLoadingCustomer } = useGetCustomer(customerId, {
        query: { queryKey: ["getCustomer", customerId], enabled: !!customerId }
    });

    const { data: conversations, isLoading: isLoadingConversations } = useGetCustomerConversations(customerId, {
        query: { queryKey: ["getCustomerConversations", customerId], enabled: !!customerId }
    });

    const sendMessageMutation = useSendMessage();
    const isSending = sendMessageMutation.isPending;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversations]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !customer) return;

        try {
            await sendMessageMutation.mutateAsync({
                data: {
                    to: customer.phone,
                    body: messageText.trim()
                }
            });
            setMessageText("");
            toast.success("Message sent successfully");
            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", customerId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            queryClient.invalidateQueries({ queryKey: ["listCustomers"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to send message");
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
            <PageHeader
                icon={User}
                title={customer?.name || customer?.phone || "Contact Details"}
                description={`${customer?.phone || ""} ${customer?.city ? `· ${customer.city}` : ""} · Added ${customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ""}`}
                breadcrumbs={[
                    { label: "Inbox & CRM" },
                    { label: "Contacts", href: "/contacts" },
                    { label: customer?.name || customer?.phone || "Details" }
                ]}
                actions={
                    <Link href="/contacts">
                        <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer">
                            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                            Back to Contacts
                        </Button>
                    </Link>
                }
            />

            <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="py-4 border-b border-border bg-muted/20">
                    <CardTitle className="text-base font-medium">Conversation History</CardTitle>
                </CardHeader>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {isLoadingConversations ? (
                        <div className="space-y-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                    <Skeleton className="h-20 w-[60%] rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : conversations?.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <p>No messages in history</p>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-4">
                            {conversations?.map((conv) => {
                                const isInbound = conv.direction === "inbound";
                                return (
                                    <div key={conv.id} className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
                                        <div className="flex items-baseline gap-2 mb-1 px-1">
                                            {isInbound && <span className="text-xs font-medium">{customer?.name || "Customer"}</span>}
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(conv.createdAt).toLocaleString('en-IN', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                            {!isInbound && <span className="text-xs font-medium">Sent</span>}
                                        </div>

                                        <div className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${isInbound
                                            ? 'bg-card border border-border text-foreground rounded-tl-sm'
                                            : 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm'
                                            }`}>
                                            {conv.message}
                                        </div>

                                        {conv.intent && isInbound && (
                                            <div className="mt-1.5 ml-1">
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-muted">
                                                    intent: {conv.intent}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                );
                            }).reverse()}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Chat Input Form */}
                <div className="p-3 border-t border-border bg-card shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder={customer?.phone ? `Type a message to ${customer.name || customer.phone}...` : "Type a message..."}
                                className="min-h-[44px] max-h-[120px] resize-none py-3"
                                disabled={isSending || !customer}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                        </div>
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isSending || !messageText.trim() || !customer}
                            className="h-[44px] w-[44px] shrink-0"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
