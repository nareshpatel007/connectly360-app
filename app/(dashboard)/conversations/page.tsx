"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    useListConversations,
    useGetCustomerConversations,
    useSendMessage,
    useUploadMedia,
    useRetryMessage,
    useGetConversationCounts,
    useGetInboxSettings,
    useGetWindowStatus,
    useMarkConversationAsRead,
    useGetCustomer,
    useListCustomers,
    useListQuickReplies,
    useCustomerNotes,
    useWorkspaceTags,
    type QuickReplyItem,
    type Conversation,
} from "@workspace/api-client-react";
import { interpolateQuickReply } from "@/lib/quick-replies";
import { InternalNotesSheet } from "@/components/notes/InternalNotesSheet";

import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/components/notifications/NotificationRealtimeProvider";
import { useAuth } from "@/lib/auth-context";
import {
    formatMessageDateSeparator,
    formatConversationListTimestamp,
    formatMessageTime,
} from "@/lib/date-utils";
import { NewConversationModal } from "@/components/conversations/NewConversationModal";
import { ConversationStatusDropdown } from "@/components/conversations/ConversationStatusDropdown";
import { ConversationAssigneeDropdown } from "@/components/conversations/ConversationAssigneeDropdown";
import { ConversationHeaderMenu } from "@/components/conversations/ConversationHeaderMenu";
import { ConversationTagsManager } from "@/components/conversations/ConversationTagsManager";
import { BulkTagConversationsModal } from "@/components/conversations/BulkTagConversationsModal";
import { CopilotDropdown } from "@/components/conversations/CopilotDropdown";
import { QuickReplyPicker } from "@/components/conversations/QuickReplyPicker";
import { TemplatePickerModal } from "@/components/conversations/TemplatePickerModal";
import { MessageRenderer } from "@/components/conversations/bubbles/MessageRenderer";
import { AttachmentMenu } from "@/components/conversations/composer/AttachmentMenu";
import { AttachmentPreviewBar, type PendingAttachment } from "@/components/conversations/composer/AttachmentPreviewBar";
import { EmojiPickerPopover } from "@/components/conversations/composer/EmojiPickerPopover";
import { ReplyQuoteBar } from "@/components/conversations/composer/ReplyQuoteBar";
import { LocationPickerDialog } from "@/components/conversations/composer/LocationPickerDialog";
import { ContactPickerDialog } from "@/components/conversations/composer/ContactPickerDialog";
import {
    Search,
    User,
    MessageSquare,
    Plus,
    Phone,
    Send,
    Bot,
    Clock,
    BookOpen,
    Smile,
    Paperclip,
    Mic,
    CheckCheck,
    Loader2,
    Zap,
    StickyNote,


    Bell,
    ArrowDown,
    ArrowLeft,
    ShieldAlert,
    UserCheck,
    Sparkles,
    CheckCircle2,
    X,
    Tag as TagIcon,
} from "lucide-react";

interface GroupedReaction {
    emoji: string;
    count: number;
    users: string[];
}

function groupReactions(reactions: any[] = []): GroupedReaction[] {
    if (!Array.isArray(reactions) || reactions.length === 0) return [];
    const counts: { [emoji: string]: GroupedReaction } = {};
    for (const r of reactions) {
        if (!r || !r.emoji) continue;
        const emoji = r.emoji;
        if (!counts[emoji]) {
            counts[emoji] = { emoji, count: 0, users: [] };
        }
        counts[emoji].count += 1;
        if (r.contact_name) counts[emoji].users.push(r.contact_name);
        else if (r.from) counts[emoji].users.push(r.from);
    }
    return Object.values(counts);
}

function ConversationsContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { token, user } = useAuth();
    const {
        connectionStatus,
        activeCustomerId,
        setActiveCustomerId,
        browserPermission,
        requestBrowserPermission,
        isSupported
    } = useRealtime();

    // URL State management
    const urlStatus = searchParams.get("status") || "all";
    const [selectedTab, setSelectedTab] = useState(urlStatus); // all, open, pending, resolved, unread
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [replyText, setReplyText] = useState("");
    const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

    // Modals
    const [isNewConvOpen, setIsNewConvOpen] = useState(false);
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isNotesSheetOpen, setIsNotesSheetOpen] = useState(false);
    const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);

    // Bulk selection state
    const [isBulkSelecting, setIsBulkSelecting] = useState(false);
    const [selectedThreadIds, setSelectedThreadIds] = useState<number[]>([]);


    // Reply & Attachment State
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);

    // Mobile Master-Detail toggle
    const [showMobileList, setShowMobileList] = useState(true);

    // Quick Replies & Slash Command autocomplete
    const { data: allQuickReplies = [] } = useListQuickReplies();
    const [slashMenuDismissed, setSlashMenuDismissed] = useState(false);
    const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

    // Reset slash dismiss if text doesn't start with /
    useEffect(() => {
        if (!replyText.startsWith("/")) {
            setSlashMenuDismissed(false);
            setSlashSelectedIndex(0);
        }
    }, [replyText]);

    const matchingSlashReplies = useMemo(() => {
        if (!replyText.startsWith("/") || slashMenuDismissed) return [];
        const query = replyText.slice(1).trim().toLowerCase();
        return (allQuickReplies || [])
            .filter((r) =>
                r.shortcut.toLowerCase().replace(/^\//, "").includes(query) ||
                r.title.toLowerCase().includes(query)
            )
            .slice(0, 6);
    }, [replyText, allQuickReplies, slashMenuDismissed]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 250);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Synchronize tab with URL
    const handleTabChange = (newTab: string) => {
        setSelectedTab(newTab);
        const params = new URLSearchParams(searchParams.toString());
        if (newTab === "all") {
            params.delete("status");
        } else {
            params.set("status", newTab);
        }
        router.replace(`/conversations?${params.toString()}`);
    };

    // Mark as read mutation
    const markAsReadMutation = useMarkConversationAsRead();

    const paramId = searchParams.get("customer_id") || searchParams.get("conversation");
    const paramPhone = searchParams.get("phone");

    // Search customer if phone parameter provided without customer_id
    const { data: phoneMatchedCustomers } = useListCustomers(
        !paramId && paramPhone ? { search: paramPhone } : undefined
    );

    // Automatically mark conversation messages and notifications as read whenever opened
    useEffect(() => {
        if (!activeCustomerId) return;
        markAsReadMutation.mutate(activeCustomerId);
    }, [activeCustomerId]);

    // Also re-mark as read when window regains focus while viewing active conversation
    useEffect(() => {
        const handleWindowFocus = () => {
            if (activeCustomerId && !document.hidden) {
                markAsReadMutation.mutate(activeCustomerId);
            }
        };
        window.addEventListener("focus", handleWindowFocus);
        return () => window.removeEventListener("focus", handleWindowFocus);
    }, [activeCustomerId]);

    // Fetch conversation dynamic counts
    const { data: countsData } = useGetConversationCounts();
    const counts = countsData?.counts || { all: 0, open: 0, pending: 0, resolved: 0, unread: 0 };

    // Fetch inbox configuration settings
    const { data: settingsData } = useGetInboxSettings();
    const inboxConfig = settingsData?.settings;
    const composerSettings = inboxConfig?.composer || {
        ai_copilot: true,
        templates: true,
        emoji: true,
        attachments: true,
        image: true,
        video: true,
        document: true,
        audio: false,
        quick_replies: true,
    };

    // Fetch workspace tags for filtering
    const { data: workspaceTagsData } = useWorkspaceTags();
    const workspaceTags = workspaceTagsData?.data || [];

    // Fetch conversation thread list
    const { data: conversations, isLoading: isLoadingAll } = useListConversations({
        status: selectedTab,
        search: debouncedSearch,
        tag: selectedTag !== "all" ? selectedTag : undefined,
    });

    // Chat threads list
    const chatThreads = useMemo(() => {
        if (!conversations) return [];
        return conversations;
    }, [conversations]);

    // Filtered threads
    const filteredThreads = useMemo(() => {
        return chatThreads;
    }, [chatThreads]);

    // Synchronize active customer from URL query param if present
    useEffect(() => {
        if (paramId && !isNaN(Number(paramId))) {
            const numId = Number(paramId);
            setActiveCustomerId(numId);
            setShowMobileList(false);
            return;
        }

        if (paramPhone) {
            const cleanParam = paramPhone.replace(/\D/g, "");
            if (chatThreads.length > 0) {
                const match = chatThreads.find((t) => {
                    const cleanPhone = (t.customerPhone || "").replace(/\D/g, "");
                    return cleanPhone === cleanParam || (cleanParam.length >= 10 && cleanPhone.endsWith(cleanParam.slice(-10)));
                });
                if (match) {
                    setActiveCustomerId(match.customerId);
                    setShowMobileList(false);
                    return;
                }
            }
            if (phoneMatchedCustomers && phoneMatchedCustomers.length > 0) {
                const matched = phoneMatchedCustomers.find((c) => {
                    const cleanPhone = (c.phone || "").replace(/\D/g, "");
                    return cleanPhone === cleanParam || (cleanParam.length >= 10 && cleanPhone.endsWith(cleanParam.slice(-10)));
                }) || phoneMatchedCustomers[0];
                if (matched) {
                    setActiveCustomerId(matched.id);
                    setShowMobileList(false);
                }
            }
        }
    }, [paramId, paramPhone, chatThreads, phoneMatchedCustomers, setActiveCustomerId]);

    // Auto-select first thread if none active on desktop and no URL parameter target
    useEffect(() => {
        const hasUrlTarget = !!(paramId || paramPhone);
        if (!hasUrlTarget && activeCustomerId === null && filteredThreads.length > 0 && typeof window !== "undefined" && window.innerWidth >= 768) {
            setActiveCustomerId(filteredThreads[0].customerId);
        }
    }, [filteredThreads, activeCustomerId, setActiveCustomerId, paramId, paramPhone]);

    // Retrieve active customer messages
    const { data: activeConversations, isLoading: isLoadingThread } = useGetCustomerConversations(
        activeCustomerId || 0,
        { query: { queryKey: ["getCustomerConversations", activeCustomerId], enabled: !!activeCustomerId } }
    );

    // Fallback fetch if active customer isn't in chatThreads array
    const { data: fallbackCustomer } = useGetCustomer(activeCustomerId || 0, {
        query: { enabled: !!activeCustomerId }
    });

    const activeThread = useMemo(() => {
        const found = chatThreads.find((t) => t.customerId === activeCustomerId);
        if (found) return found;
        if (fallbackCustomer && fallbackCustomer.id === activeCustomerId) {
            return {
                id: 0,
                customerId: fallbackCustomer.id,
                customerName: fallbackCustomer.name || [fallbackCustomer.first_name, fallbackCustomer.last_name].filter(Boolean).join(" ") || fallbackCustomer.phone,
                customerPhone: fallbackCustomer.phone,
                email: fallbackCustomer.email,
                city: fallbackCustomer.city,
                stage: fallbackCustomer.stage,
                conversationStatus: (fallbackCustomer as any).conversation_status || "open",
                status: "open",
                message: "",
                direction: "outbound" as const,
                createdAt: fallbackCustomer.createdAt || (fallbackCustomer as any).created_at || new Date().toISOString(),
                isInside24hWindow: true,
            } as Conversation;
        }
        return undefined;
    }, [chatThreads, activeCustomerId, fallbackCustomer]);

    // Check 24-hour window status for active customer
    const { data: windowStatus } = useGetWindowStatus(activeCustomerId);
    const isOutside24hWindow = activeThread?.isInside24hWindow === false || windowStatus?.inside_window === false;

    // Fetch active customer's internal notes count
    const { data: activeCustomerNotes = [] } = useCustomerNotes(activeThread?.customerId);


    const applyQuickReply = (qr: QuickReplyItem) => {
        const resolved = interpolateQuickReply(qr.content, {
            contactName: activeThread?.customerName,
            phone: activeThread?.customerPhone,
            email: (activeThread as any)?.email,
            agentName: user?.name,
        });
        setReplyText(resolved);
        setSlashMenuDismissed(true);
    };


    // Chronologically sorted messages
    const sortedConversations = useMemo(() => {
        if (!activeConversations) return [];
        return [...activeConversations]
            .filter((c: any) => c.type !== "reaction" && c.message !== "Received Reaction message")
            .sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
    }, [activeConversations]);

    // Group messages by localized date header
    const groupedMessages = useMemo(() => {
        const groups: { dateLabel: string; messages: any[] }[] = [];
        let currentDateLabel = "";
        let currentGroup: any[] = [];

        sortedConversations.forEach((msg) => {
            const dateLabel = formatMessageDateSeparator(msg.createdAt);
            if (dateLabel !== currentDateLabel) {
                if (currentGroup.length > 0) {
                    groups.push({ dateLabel: currentDateLabel, messages: currentGroup });
                }
                currentDateLabel = dateLabel;
                currentGroup = [msg];
            } else {
                currentGroup.push(msg);
            }
        });

        if (currentGroup.length > 0) {
            groups.push({ dateLabel: currentDateLabel, messages: currentGroup });
        }

        return groups;
    }, [sortedConversations]);

    // Scroll helpers
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const atBottom = scrollHeight - scrollTop - clientHeight < 100;
        isAtBottomRef.current = atBottom;
        if (atBottom) {
            setHasUnreadBelow(false);
        }
    };

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
        setHasUnreadBelow(false);
        isAtBottomRef.current = true;
    };

    useEffect(() => {
        if (isAtBottomRef.current) {
            scrollToBottom(false);
        } else {
            setHasUnreadBelow(true);
        }
    }, [sortedConversations.length]);

    // Outbound composer send & media upload
    const sendMessage = useSendMessage();
    const uploadMedia = useUploadMedia();
    const retryMessage = useRetryMessage();
    const isSending = sendMessage.isPending || uploadMedia.isPending || retryMessage.isPending;

    const handleSelectFile = (file: File, type: "image" | "video" | "document" | "audio") => {
        // Enforce Meta rules
        if (type === "image" && file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Meta WhatsApp limit for images is 5MB.",
                variant: "destructive",
            });
            return;
        }
        if ((type === "video" || type === "audio") && file.size > 16 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: `Meta WhatsApp limit for ${type} is 16MB.`,
                variant: "destructive",
            });
            return;
        }
        if (type === "document" && file.size > 100 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Meta WhatsApp limit for documents is 100MB.",
                variant: "destructive",
            });
            return;
        }

        setPendingAttachment({
            file,
            type,
            caption: "",
        });
    };

    const handleSendReply = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!replyText.trim() && !pendingAttachment) || !activeCustomerId || !activeThread) return;

        // If outside 24-hour window, WhatsApp requires template!
        if (isOutside24hWindow) {
            toast({
                title: "Template Required",
                description: "Customer is outside the 24-hour service window. Please select an approved template.",
                variant: "destructive",
            });
            setIsTemplatePickerOpen(true);
            return;
        }

        const outgoingBody = replyText.trim();
        const tempId = Date.now();

        // 1. Sending Attachment Flow
        if (pendingAttachment) {
            setUploadProgress(25);
            setUploadStatusText("Uploading media to WhatsApp...");

            try {
                const uploadRes = await uploadMedia.mutateAsync({
                    file: pendingAttachment.file,
                    caption: pendingAttachment.caption || outgoingBody || undefined,
                });

                const mediaObj = uploadRes?.media || uploadRes?.data || uploadRes;
                const uploadedUrl = mediaObj?.media_url || mediaObj?.url || uploadRes?.url || uploadRes?.media_url;
                const uploadedMediaId = mediaObj?.media_id || uploadRes?.media_id;
                const uploadedFilename = mediaObj?.filename || uploadRes?.filename || pendingAttachment.file.name;

                if (!uploadedUrl) {
                    throw new Error("Unable to obtain media URL from upload response.");
                }

                setUploadProgress(80);
                setUploadStatusText("Sending message...");

                await sendMessage.mutateAsync({
                    data: {
                        to: activeThread.customerPhone,
                        type: pendingAttachment.type,
                        media_id: uploadedMediaId,
                        media_url: uploadedUrl,
                        filename: uploadedFilename,
                        caption: pendingAttachment.caption || outgoingBody || undefined,
                        reply_to_message_id: replyingTo?.providerMessageId || replyingTo?.provider_message_id || replyingTo?.external_message_id || (replyingTo?.id ? String(replyingTo.id) : undefined),
                    },
                });

                setUploadProgress(100);
                setUploadStatusText("Delivered");
                toast({ title: "Media Sent", description: "Attachment dispatched successfully." });

                setPendingAttachment(null);
                setUploadProgress(null);
                setUploadStatusText(null);
                setReplyText("");
                setReplyingTo(null);

                queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
                queryClient.invalidateQueries({ queryKey: ["listConversations"] });
            } catch (err: any) {
                setUploadProgress(null);
                setUploadStatusText(null);
                toast({
                    title: "Failed to send media",
                    description: err.message || "Could not dispatch attachment",
                    variant: "destructive",
                });
            }
            return;
        }

        // 2. Normal Text Send Flow
        const tempMsg = {
            id: tempId,
            customerId: activeCustomerId,
            customerName: activeThread.customerName,
            customerPhone: activeThread.customerPhone,
            message: outgoingBody,
            type: "text",
            direction: "outbound" as const,
            status: "pending",
            isRead: 1,
            replyToMessageId: replyingTo?.id ? String(replyingTo.id) : undefined,
            quotedMessage: replyingTo
                ? {
                      id: replyingTo.id,
                      message: replyingTo.message,
                      senderName: replyingTo.senderName || (replyingTo.direction === "outbound" ? "You" : activeThread.customerName),
                      type: replyingTo.type,
                  }
                : null,
            createdAt: new Date().toISOString(),
        };

        // Optimistically insert into active conversation cache
        queryClient.setQueryData(
            ["getCustomerConversations", activeCustomerId],
            (old: any[] | undefined) => [...(old || []), tempMsg]
        );

        setReplyText("");
        setReplyingTo(null);
        setTimeout(() => scrollToBottom(true), 50);

        try {
            await sendMessage.mutateAsync({
                data: {
                    to: activeThread.customerPhone,
                    body: outgoingBody,
                    type: "text",
                    reply_to_message_id: replyingTo?.providerMessageId || replyingTo?.provider_message_id || replyingTo?.external_message_id || (replyingTo?.id ? String(replyingTo.id) : undefined),
                },
            });

            toast({ title: "Reply Sent", description: "Outbound message dispatched successfully." });

            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        } catch (err: any) {
            queryClient.setQueryData(
                ["getCustomerConversations", activeCustomerId],
                (old: any[] | undefined) => (old || []).filter((m) => m.id !== tempId)
            );
            toast({
                title: "Failed to send",
                description: err.message || "Could not dispatch reply",
                variant: "destructive",
            });
        }
    };

    // Retry sending a previously failed message
    const handleRetryMessage = async (conv: any) => {
        if (!conv || !activeThread?.customerPhone) return;

        const hasMediaUrl = conv.mediaUrl || conv.media_url;
        const msgType = conv.type || "text";

        if (["image", "video", "audio", "document"].includes(msgType) && !hasMediaUrl) {
            toast({
                title: "Cannot retry this attachment",
                description: "The original file was not stored on the server. Please attach the file again using the attachment button.",
                variant: "destructive",
            });
            return;
        }

        try {
            if (conv.id && typeof conv.id === "number") {
                await retryMessage.mutateAsync({ messageId: conv.id });
            } else {
                await sendMessage.mutateAsync({
                    data: {
                        to: activeThread.customerPhone,
                        type: msgType,
                        body: conv.message || conv.body,
                        media_url: hasMediaUrl,
                        filename: conv.filename || conv.media_filename,
                        caption: conv.caption,
                    },
                });
            }

            toast({
                title: "Message Retried",
                description: "Dispatched message to WhatsApp.",
            });

            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        } catch (err: any) {
            toast({
                title: "Retry Failed",
                description: err.message || "Could not re-send message.",
                variant: "destructive",
            });
        }
    };

    // Reaction handler
    const handleReact = async (targetMsg: any, emoji: string) => {
        if (!activeThread?.customerPhone || !targetMsg) return;

        const targetExternalId = targetMsg.providerMessageId 
            || targetMsg.provider_message_id 
            || targetMsg.external_message_id 
            || targetMsg.externalMessageId 
            || String(targetMsg.id);

        // Optimistically update reactions in local query cache
        queryClient.setQueryData(
            ["getCustomerConversations", activeCustomerId],
            (old: any[] | undefined) => {
                if (!old) return old;
                return old.map((m) => {
                    if (m.id !== targetMsg.id) return m;
                    const existingReactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
                    const userReactionIdx = existingReactions.findIndex(
                        (r) => r.user_id === user?.id || r.from === String(user?.id) || r.from === "agent" || r.from === "business"
                    );

                    if (userReactionIdx >= 0) {
                        if (existingReactions[userReactionIdx].emoji === emoji) {
                            existingReactions.splice(userReactionIdx, 1);
                        } else {
                            existingReactions[userReactionIdx] = { ...existingReactions[userReactionIdx], emoji };
                        }
                    } else {
                        existingReactions.push({ emoji, user_id: user?.id, from: "business", contact_name: "You" });
                    }

                    return { ...m, reactions: existingReactions };
                });
            }
        );

        try {
            await sendMessage.mutateAsync({
                data: {
                    to: activeThread.customerPhone,
                    type: "reaction",
                    reaction_emoji: emoji,
                    emoji: emoji,
                    reaction_message_id: targetExternalId,
                    target_wamid: targetExternalId,
                    message_id: targetExternalId,
                },
            });
        } catch (err: any) {
            toast({
                title: "Reaction Failed",
                description: err.message || "Could not send WhatsApp reaction",
                variant: "destructive",
            });
        }
    };

    // Location handler
    const handleSendLocation = async (loc: { latitude: number; longitude: number; name?: string; address?: string }) => {
        if (!activeThread?.customerPhone) return;

        if (isOutside24hWindow) {
            toast({
                title: "Template Required",
                description: "Customer is outside the 24-hour service window. Please select an approved template.",
                variant: "destructive",
            });
            setIsTemplatePickerOpen(true);
            return;
        }

        try {
            await sendMessage.mutateAsync({
                data: {
                    to: activeThread.customerPhone,
                    type: "location",
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    location_name: loc.name,
                    location_address: loc.address,
                },
            });
            toast({ title: "Location Shared", description: "Location message dispatched." });
            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        } catch (err: any) {
            toast({
                title: "Failed to send location",
                description: err.message || "Could not send location",
                variant: "destructive",
            });
        }
    };

    // Contact card handler
    const handleSendContact = async (contacts: any[]) => {
        if (!activeThread?.customerPhone) return;

        if (isOutside24hWindow) {
            toast({
                title: "Template Required",
                description: "Customer is outside the 24-hour service window. Please select an approved template.",
                variant: "destructive",
            });
            setIsTemplatePickerOpen(true);
            return;
        }

        try {
            await sendMessage.mutateAsync({
                data: {
                    to: activeThread.customerPhone,
                    type: "contacts",
                    contacts,
                },
            });
            toast({ title: "Contact Shared", description: "Contact card dispatched." });
            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        } catch (err: any) {
            toast({
                title: "Failed to send contact",
                description: err.message || "Could not send contact",
                variant: "destructive",
            });
        }
    };

    // Selecting a conversation thread
    const handleSelectThread = (cid: number) => {
        setActiveCustomerId(cid);
        setShowMobileList(false);

        // Update URL query param smoothly
        const params = new URLSearchParams(searchParams.toString());
        params.set("customer_id", String(cid));
        router.replace(`/conversations?${params.toString()}`);

        markAsReadMutation.mutate(cid);
    };

    return (
        <div className="flex h-full w-full bg-white overflow-hidden text-slate-800 font-sans antialiased relative">
            {/* COLUMN 1: CONVERSATION LIST (SIDEBAR) */}
            <div
                className={`w-full md:w-80 lg:w-[340px] shrink-0 border-r border-slate-200 flex flex-col bg-white z-10 transition-all ${
                    showMobileList ? "flex" : "hidden md:flex"
                }`}
            >
                {/* Header & New Conversation Action */}
                <div className="p-3 border-b border-slate-150 shrink-0 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <h2 className="text-sm font-semibold text-[#172033] tracking-tight">Inbox</h2>
                            {counts.unread > 0 && (
                                <span className="bg-[#2F8F83] text-white text-[10px] font-medium px-1.5 py-0.2 rounded-full shadow-2xs">
                                    {counts.unread}
                                </span>
                            )}
                        </div>

                        {/* + New Conversation Button */}
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsNewConvOpen(true)}
                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white font-medium text-xs h-7.5 px-2.5 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                            <Plus size={13} strokeWidth={2} />
                            <span>New Message</span>
                        </Button>
                    </div>

                    {/* Filter Pills with Dynamic Counts */}
                    <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {[
                            { key: "all", label: "All", count: counts.all },
                            { key: "open", label: "Open", count: counts.open },
                            { key: "pending", label: "Pending", count: counts.pending },
                            { key: "resolved", label: "Resolved", count: counts.resolved },
                            { key: "unread", label: "Unread", count: counts.unread },
                        ].map((tabItem) => (
                            <button
                                key={tabItem.key}
                                onClick={() => handleTabChange(tabItem.key)}
                                className={`text-[10px] font-medium py-1 px-1.5 sm:px-2 rounded-full border transition-all cursor-pointer uppercase tracking-tight flex items-center justify-center gap-1 shrink-0 ${
                                    selectedTab === tabItem.key
                                        ? "bg-[#2F8F83] text-white border-transparent shadow-xs"
                                        : "bg-white border-[#E5E9EE] text-[#5F6B7A] hover:bg-slate-50"
                                }`}
                            >
                                <span>{tabItem.label}</span>
                                {tabItem.count !== undefined && (
                                    <span
                                        className={`text-[9px] px-1 py-0.2 rounded-full font-semibold ${
                                            selectedTab === tabItem.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        {tabItem.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tag Filter Row */}
                    {workspaceTags.length > 0 && (
                        <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar scrollbar-none pt-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-0.5 pr-0.5">
                                <TagIcon size={10} />
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedTag("all")}
                                className={`text-[9px] font-semibold py-0.5 px-2 rounded-md border transition-all cursor-pointer shrink-0 ${
                                    selectedTag === "all"
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                All Tags
                            </button>
                            {workspaceTags.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setSelectedTag(selectedTag === t.name ? "all" : t.name)}
                                    style={{
                                        borderColor: selectedTag === t.name ? (t.color || "#0d9488") : undefined,
                                        backgroundColor: selectedTag === t.name ? `${t.color || "#0d9488"}20` : undefined,
                                        color: selectedTag === t.name ? (t.color || "#0d9488") : undefined,
                                    }}
                                    className={`text-[9px] font-semibold py-0.5 px-2 rounded-md border transition-all cursor-pointer shrink-0 ${
                                        selectedTag === t.name
                                            ? "font-bold"
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Box */}
                <div className="px-3 py-2 border-b border-[#E5E9EE] bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8A95A3]" />
                        <Input
                            type="search"
                            placeholder="Search active chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 text-xs h-8.5 rounded-lg bg-[#F7F9FA] border-[#E5E9EE] focus:bg-white text-[#172033] placeholder-[#8A95A3] focus-visible:ring-1 focus-visible:ring-[#2F8F83] focus-visible:ring-offset-0"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-2.5 text-[#8A95A3] hover:text-[#172033]"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Chats Thread List */}
                <div className="flex-1 overflow-auto bg-white flex flex-col">
                    <div className="px-3.5 py-1.5 text-[10px] font-semibold text-[#5F6B7A] tracking-wider bg-[#F7F9FA] border-b border-[#E5E9EE] uppercase flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <span>Conversations</span>
                            {filteredThreads.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBulkSelecting(!isBulkSelecting);
                                        setSelectedThreadIds([]);
                                    }}
                                    className={`text-[10px] font-semibold rounded px-1.5 py-0.5 transition-colors cursor-pointer ${
                                        isBulkSelecting
                                            ? "bg-[#378179] text-white"
                                            : "text-[#378179] hover:bg-[#378179]/10"
                                    }`}
                                >
                                    {isBulkSelecting ? "Done" : "Select"}
                                </button>
                            )}
                        </div>
                        {browserPermission === "default" && isSupported && (
                            <button
                                onClick={requestBrowserPermission}
                                className="text-[10px] font-semibold text-[#2F8F83] hover:underline flex items-center gap-1 cursor-pointer"
                                title="Enable browser alerts for new messages"
                            >
                                <Bell size={10} />
                                Alerts
                            </button>
                        )}
                    </div>

                    {/* Bulk Selection Action Bar */}
                    {isBulkSelecting && (
                        <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs shrink-0">
                            <span className="font-semibold text-emerald-900 text-[11px]">
                                {selectedThreadIds.length} selected
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setIsBulkTagModalOpen(true)}
                                    disabled={selectedThreadIds.length === 0}
                                    className="h-6 px-2 text-[10px] bg-[#378179] hover:bg-[#2d6f68] text-white rounded-md font-semibold gap-1"
                                >
                                    <TagIcon size={10} />
                                    <span>Bulk Tag</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedThreadIds([])}
                                    className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-800 rounded-md"
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-slate-100">
                        {isLoadingAll ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="p-3.5 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-28 rounded" />
                                        <Skeleton className="h-3 w-10 rounded" />
                                    </div>
                                    <Skeleton className="h-3.5 w-full rounded" />
                                </div>
                            ))
                        ) : filteredThreads.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 space-y-3">
                                <MessageSquare className="mx-auto text-slate-200" size={32} />
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-700">No conversations found</p>
                                    <p className="text-[11px] text-slate-400">
                                        {searchQuery ? "Try a different search term" : "Start a new conversation with a customer"}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsNewConvOpen(true)}
                                    className="text-xs border-[#378179] text-[#378179] hover:bg-[#378179]/05 rounded-lg h-7.5"
                                >
                                    <Plus size={12} className="mr-1" /> New Conversation
                                </Button>
                            </div>
                        ) : (
                            filteredThreads.map((thread) => {
                                const isSelected = thread.customerId === activeCustomerId;
                                const threadStatus = thread.conversationStatus || thread.status || "open";

                                return (
                                    <button
                                        key={thread.customerId}
                                        onClick={() => {
                                            if (isBulkSelecting) {
                                                setSelectedThreadIds((prev) =>
                                                    prev.includes(thread.customerId)
                                                        ? prev.filter((id) => id !== thread.customerId)
                                                        : [...prev, thread.customerId]
                                                );
                                            } else {
                                                handleSelectThread(thread.customerId);
                                            }
                                        }}
                                        className={`w-full text-left p-3 flex gap-3 transition-all text-xs border-l-[3.5px] cursor-pointer relative ${
                                            isSelected
                                                ? "bg-[#f2faf7] border-[#378179]"
                                                : "border-transparent hover:bg-slate-50 bg-white"
                                        }`}
                                    >
                                        {/* Multi-select checkbox */}
                                        {isBulkSelecting && (
                                            <input
                                                type="checkbox"
                                                checked={selectedThreadIds.includes(thread.customerId)}
                                                onChange={() => {}}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#378179] focus:ring-[#378179] self-center shrink-0 cursor-pointer pointer-events-none"
                                            />
                                        )}

                                        {/* Avatar with unread badge */}
                                        <div className="relative shrink-0">
                                            <div className="h-9.5 w-9.5 rounded-full bg-[#378179]/10 text-[#378179] flex items-center justify-center font-bold text-xs">
                                                {thread.customerName ? thread.customerName.charAt(0).toUpperCase() : "C"}
                                            </div>
                                            {(thread.unreadCount ?? 0) > 0 && !isSelected && (
                                                <span className="absolute -top-1 -right-1 bg-[#378179] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-xs">
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5">
                                                    {thread.customerName || thread.customerPhone}
                                                    {thread.lastMessageDirection === "outbound" && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-normal">
                                                            <Bot size={10} className="text-[#378179]/70 shrink-0" />
                                                            Bot
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-slate-400 shrink-0 ml-1 font-medium">
                                                    {formatConversationListTimestamp(thread.lastMessageTime || thread.createdAt)}
                                                </span>
                                            </div>

                                            <p className="text-slate-600 truncate text-[11px] leading-relaxed">
                                                {thread.lastMessage === "Received Reaction message"
                                                    ? "Reacted to your message"
                                                    : thread.lastMessage || "No messages yet"}
                                            </p>

                                            <div className="flex items-center justify-between pt-1 gap-1">
                                                {/* Status indicator & Tag Chips */}
                                                <div className="flex items-center gap-1 flex-wrap min-w-0">
                                                    <span
                                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize shrink-0 ${
                                                            threadStatus === "open"
                                                                ? "bg-[#378179]/10 text-[#378179]"
                                                                : threadStatus === "pending"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {threadStatus}
                                                    </span>

                                                    {/* Tag chips */}
                                                    {thread.tags && thread.tags.length > 0 && (
                                                        <>
                                                            {thread.tags.slice(0, 2).map((tg) => (
                                                                <span
                                                                    key={tg.id || tg.name}
                                                                    style={{
                                                                        backgroundColor: `${tg.color || "#0d9488"}15`,
                                                                        color: tg.color || "#0d9488",
                                                                        borderColor: `${tg.color || "#0d9488"}30`,
                                                                    }}
                                                                    className="text-[8px] font-semibold px-1 py-0.2 rounded border truncate max-w-[65px]"
                                                                >
                                                                    {tg.name}
                                                                </span>
                                                            ))}
                                                            {thread.tags.length > 2 && (
                                                                <span className="text-[8px] text-slate-400 font-bold">
                                                                    +{thread.tags.length - 2}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {(thread.unreadCount ?? 0) > 0 && !isSelected && (
                                                    <span className="text-[9px] font-bold text-[#378179] shrink-0">
                                                        {thread.unreadCount} unread
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* COLUMN 2: RIGHT PANEL (CHAT THREAD & COMPOSER) */}
            <div
                className={`flex-1 flex flex-col bg-[#F8FAFC]/50 relative transition-all ${
                    !showMobileList ? "flex" : "hidden md:flex"
                }`}
            >
                {activeThread ? (
                    <>
                        {/* Thread Header */}
                        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                {/* Mobile Back Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowMobileList(true)}
                                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                >
                                    <ArrowLeft size={16} />
                                </button>

                                <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {activeThread.customerName ? activeThread.customerName.charAt(0).toUpperCase() : "C"}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                                            <span className="truncate">{activeThread.customerName}</span>
                                            {activeThread.customerPhone && (
                                                <span className="text-[11px] text-slate-400 font-normal shrink-0">
                                                    (+{activeThread.customerPhone})
                                                </span>
                                            )}
                                        </h3>
                                        <ConversationTagsManager
                                            conversationId={activeThread.customerId}
                                            initialTags={activeThread.tags}
                                            compact
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                                        <Bot size={11} className="text-[#2F8F83]" />
                                        Bot Available
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 shrink-0">
                                {/* Live Realtime Status Pill */}
                                <div className="hidden sm:flex items-center text-[10px] font-medium mr-1">
                                    {connectionStatus === "connected" ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-bold">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Live
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-medium">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            Syncing
                                        </span>
                                    )}
                                </div>

                                {/* Assignee Dropdown */}
                                <ConversationAssigneeDropdown
                                    customerId={activeThread.customerId}
                                    currentAssigneeId={activeThread.assignedTo}
                                    currentAssigneeName={activeThread.assignee?.name}
                                />

                                {/* Interactive Status Dropdown (Open / Pending / Resolved) */}
                                <ConversationStatusDropdown
                                    customerId={activeThread.customerId}
                                    currentStatus={activeThread.conversationStatus || activeThread.status || "open"}
                                />

                                {/* Internal Notes Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsNotesSheetOpen(true)}
                                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200/60 hover:border-amber-200 shrink-0"
                                    title="Internal Team Notes"
                                >
                                    <StickyNote size={14} className="text-amber-500" />
                                    <span className="hidden sm:inline text-[11px] text-slate-700">Notes</span>
                                    {activeCustomerNotes.length > 0 && (
                                        <span className="h-4 min-w-4 px-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                                            {activeCustomerNotes.length}
                                        </span>
                                    )}
                                </button>

                                <div className="h-4 w-px bg-slate-200" />

                                {/* Three-Dot Menu */}
                                <ConversationHeaderMenu
                                    customerId={activeThread.customerId}
                                    customerName={activeThread.customerName || activeThread.customerPhone || "Customer"}
                                    customerPhone={activeThread.customerPhone}
                                    currentStatus={activeThread.conversationStatus || activeThread.status || "open"}
                                    onOpenNotes={() => setIsNotesSheetOpen(true)}
                                />

                            </div>
                        </div>

                        {/* WhatsApp 24-Hour Policy Notice Banner if outside active window */}
                        {isOutside24hWindow && (
                            <div className="px-4 py-2 bg-amber-50/90 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900 gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                                    <span className="text-[11px] leading-tight truncate">
                                        Outside 24-hour customer service window. WhatsApp requires an approved template message.
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setIsTemplatePickerOpen(true)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] h-6 px-2.5 rounded-lg shrink-0 shadow-2xs"
                                >
                                    Select Template
                                </Button>
                            </div>
                        )}

                        {/* Thread message bubble body scroll */}
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-auto p-4 space-y-4 relative"
                        >
                            {isLoadingThread ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-1/3 rounded-xl" />
                                    <Skeleton className="h-14 w-1/2 rounded-xl ml-auto bg-[#EAF7F2]/40" />
                                    <Skeleton className="h-10 w-2/5 rounded-xl" />
                                </div>
                            ) : sortedConversations.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                                    <MessageSquare size={24} className="text-slate-200" />
                                    <p>No messages yet in this conversation.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-2">
                                    {/* Initialization system log */}
                                    <div className="flex justify-center text-xs text-slate-500 font-medium py-1">
                                        <span className="bg-slate-100/80 px-3 py-1 rounded-full shadow-2xs text-[11px]">
                                            The chat has been initialized by contact {activeThread.customerName} ({activeThread.customerPhone})
                                        </span>
                                    </div>

                                    {/* Grouped Messages by Date Header */}
                                    {groupedMessages.map((group, gIdx) => (
                                        <div key={gIdx} className="space-y-3">
                                            {/* Friendly Date Separator Header */}
                                            <div className="flex justify-center py-1.5 shrink-0">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                                    {group.dateLabel}
                                                </span>
                                            </div>

                                            {/* Messages in Group */}
                                            {group.messages.map((conv, idx) => (
                                                <div key={conv.id || `msg-${idx}`} className="space-y-1">
                                                    {conv.intent === "automation_reply" && (
                                                        <div className="flex justify-center text-xs text-slate-400 font-medium py-0.5">
                                                            <span className="bg-slate-100 px-2.5 py-0.5 rounded-full shadow-2xs text-[10px]">
                                                                Automated reply sent by Bot
                                                            </span>
                                                        </div>
                                                    )}
                                                    <MessageRenderer
                                                        conv={conv}
                                                        activeCustomerName={activeThread.customerName}
                                                        activeCustomerPhone={activeThread.customerPhone}
                                                        onReply={(c) => setReplyingTo(c)}
                                                        onReact={(c, emoji) => handleReact(c, emoji)}
                                                        onRetry={(c) => handleRetryMessage(c)}
                                                        currentUserId={user?.id}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}

                            {/* Floating New Message indicator pill if scrolled up */}
                            {hasUnreadBelow && (
                                <button
                                    onClick={() => scrollToBottom(true)}
                                    className="sticky bottom-3 left-1/2 -translate-x-1/2 bg-[#378179] hover:bg-[#2b625c] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-20 cursor-pointer transition-all animate-bounce"
                                >
                                    <span>New message</span>
                                    <ArrowDown size={13} />
                                </button>
                            )}
                        </div>

                        {/* Quoted Reply context preview above composer */}
                        <ReplyQuoteBar replyingTo={replyingTo} onDismiss={() => setReplyingTo(null)} />

                        {/* Pending Attachment preview bar with upload progress */}
                        {pendingAttachment && (
                            <AttachmentPreviewBar
                                attachment={pendingAttachment}
                                uploadProgress={uploadProgress}
                                statusText={uploadStatusText}
                                onCaptionChange={(caption) =>
                                    setPendingAttachment({ ...pendingAttachment, caption })
                                }
                                onRemove={() => setPendingAttachment(null)}
                            />
                        )}

                        {/* Composer Chat Input Area */}
                        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                            <form onSubmit={handleSendReply} className="space-y-2">
                                <div className="relative">
                                    {/* Inline Slash Command Autocomplete Popover */}
                                    {matchingSlashReplies.length > 0 && (
                                        <div className="absolute bottom-full left-0 right-0 mb-1.5 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 space-y-1">
                                            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-slate-500 border-b border-slate-100">
                                                <span className="flex items-center gap-1.5 text-[#2F8F83]">
                                                    <Zap size={11} /> Quick Replies (/shortcut)
                                                </span>
                                                <span className="text-slate-400 font-normal">Press Tab / Enter to insert • Esc to dismiss</span>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                                                {matchingSlashReplies.map((qr, idx) => (
                                                    <button
                                                        key={qr.id}
                                                        type="button"
                                                        onClick={() => applyQuickReply(qr)}
                                                        className={`w-full text-left p-2 rounded-xl transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                                            idx === slashSelectedIndex
                                                                ? "bg-teal-50 text-teal-900 font-medium"
                                                                : "hover:bg-slate-50 text-slate-700"
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-bold text-slate-800 truncate">
                                                                    {qr.title}
                                                                </span>
                                                                <span className="text-[10px] font-mono font-semibold text-teal-700 bg-teal-100/60 px-1.5 py-0.2 rounded border border-teal-200/50">
                                                                    {qr.shortcut}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                                {interpolateQuickReply(qr.content, {
                                                                    contactName: activeThread?.customerName,
                                                                    phone: activeThread?.customerPhone,
                                                                    email: (activeThread as any)?.email,
                                                                    agentName: user?.name,
                                                                })}
                                                            </p>
                                                        </div>
                                                        {qr.category && (
                                                            <span className="text-[9px] text-slate-400 shrink-0 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                                                #{qr.category}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={
                                            pendingAttachment
                                                ? "Add a caption or send..."
                                                : isOutside24hWindow
                                                ? "24-hour window expired. Select an approved template..."
                                                : "Type your message here or press '/' for quick replies..."
                                        }
                                        className="min-h-[46px] max-h-[120px] text-xs sm:text-sm resize-none py-2.5 px-3 border-transparent focus-visible:ring-0 rounded-xl bg-slate-50 focus:bg-white text-slate-800 disabled:opacity-60"
                                        disabled={isSending || (isOutside24hWindow && !pendingAttachment)}
                                        onKeyDown={(e) => {
                                            if (matchingSlashReplies.length > 0) {
                                                if (e.key === "ArrowDown") {
                                                    e.preventDefault();
                                                    setSlashSelectedIndex((prev) => (prev + 1) % matchingSlashReplies.length);
                                                    return;
                                                }
                                                if (e.key === "ArrowUp") {
                                                    e.preventDefault();
                                                    setSlashSelectedIndex((prev) => (prev - 1 + matchingSlashReplies.length) % matchingSlashReplies.length);
                                                    return;
                                                }
                                                if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
                                                    e.preventDefault();
                                                    const chosen = matchingSlashReplies[slashSelectedIndex] || matchingSlashReplies[0];
                                                    if (chosen) {
                                                        applyQuickReply(chosen);
                                                        return;
                                                    }
                                                }
                                                if (e.key === "Escape") {
                                                    e.preventDefault();
                                                    setSlashMenuDismissed(true);
                                                    return;
                                                }
                                            }
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendReply();
                                            }
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
                                    {/* Action toolbar buttons configured by Admin */}
                                    <div className="flex items-center gap-1 text-slate-400">
                                        {/* AI Copilot Dropdown */}
                                        {composerSettings.ai_copilot && (
                                            <CopilotDropdown
                                                currentText={replyText}
                                                onApplyText={(val) => setReplyText(val)}
                                                customerId={activeThread.customerId}
                                                settings={inboxConfig?.copilot}
                                            />
                                        )}

                                        {/* WhatsApp Templates Picker */}
                                        {composerSettings.templates && (
                                            <button
                                                type="button"
                                                onClick={() => setIsTemplatePickerOpen(true)}
                                                className="p-1.5 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                                                title="Send WhatsApp Template"
                                            >
                                                <BookOpen size={14} />
                                            </button>
                                        )}

                                        {/* Quick Replies Picker */}
                                        {composerSettings.quick_replies && (
                                            <QuickReplyPicker
                                                context={{
                                                    contactName: activeThread?.customerName,
                                                    phone: activeThread?.customerPhone,
                                                    email: (activeThread as any)?.email,
                                                    agentName: user?.name,
                                                }}
                                                onSelect={(content) =>
                                                    setReplyText((prev) => (prev ? `${prev} ${content}` : content))
                                                }
                                            />
                                        )}


                                        {/* Searchable Emoji Picker */}
                                        {composerSettings.emoji && (
                                            <EmojiPickerPopover
                                                onSelectEmoji={(emoji) => setReplyText((prev) => prev + emoji)}
                                            />
                                        )}

                                        {/* Attachment Button with Full Meta Attachment Menu */}
                                        {composerSettings.attachments && (
                                            <AttachmentMenu
                                                onSelectFile={handleSelectFile}
                                                onOpenLocationModal={() => setIsLocationModalOpen(true)}
                                                onOpenContactModal={() => setIsContactModalOpen(true)}
                                                disabled={isSending}
                                            />
                                        )}
                                    </div>

                                    {/* Send Trigger */}
                                    <Button
                                        type="submit"
                                        disabled={
                                            isSending ||
                                            (!replyText.trim() && !pendingAttachment) ||
                                            (isOutside24hWindow && !pendingAttachment)
                                        }
                                        className="bg-[#2F8F83] hover:bg-[#267A70] text-white font-medium text-xs h-8 px-4 rounded-lg flex items-center gap-1.5 shadow-xs border-0 cursor-pointer disabled:opacity-50"
                                    >
                                        {isSending ? (
                                            <Loader2 className="animate-spin" size={13} />
                                        ) : (
                                            <>
                                                <Send size={13} />
                                                Send
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    /* No conversation selected empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center space-y-4">
                        <div className="text-[#2F8F83] opacity-90">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-[#172033] text-sm">No conversation selected</h4>
                        <p className="max-w-xs leading-normal text-[#5F6B7A] text-xs">
                            Select a chat from the left panel or initiate a new conversation with a customer.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setIsNewConvOpen(true)}
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white font-medium text-xs rounded-lg h-8 px-3.5 shadow-xs"
                            >
                                <Plus size={13} className="mr-1" /> New Message
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleTabChange("unread")}
                                className="border-[#BFE4DD] text-[#2F8F83] hover:bg-[#E8F6F3]/50 rounded-lg text-xs font-medium h-8"
                            >
                                View Unread Chats
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: New Conversation */}
            <NewConversationModal
                open={isNewConvOpen}
                onOpenChange={setIsNewConvOpen}
                onConversationCreated={(cid) => {
                    handleSelectThread(cid);
                }}
            />

            {/* Modal: WhatsApp Template Picker for active chat */}
            {activeThread && (
                <TemplatePickerModal
                    open={isTemplatePickerOpen}
                    onOpenChange={setIsTemplatePickerOpen}
                    recipientPhone={activeThread.customerPhone}
                    onTemplateSent={() => {
                        queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
                        queryClient.invalidateQueries({ queryKey: ["listConversations"] });
                    }}
                />
            )}

            {/* Modal: Location Picker Dialog */}
            <LocationPickerDialog
                open={isLocationModalOpen}
                onOpenChange={setIsLocationModalOpen}
                onSendLocation={handleSendLocation}
            />

            {/* Modal: Contact Picker Dialog */}
            <ContactPickerDialog
                open={isContactModalOpen}
                onOpenChange={setIsContactModalOpen}
                onSendContact={handleSendContact}
            />

            {/* Modal: Internal Notes Slide-over Sheet */}
            {activeThread && (
                <InternalNotesSheet
                    open={isNotesSheetOpen}
                    onOpenChange={setIsNotesSheetOpen}
                    customerId={activeThread.customerId}
                    conversationId={activeThread.id || null}
                    customerName={activeThread.customerName || activeThread.customerPhone}
                />
            )}

            {/* Modal: Bulk Tag Conversations */}
            <BulkTagConversationsModal
                isOpen={isBulkTagModalOpen}
                onClose={() => setIsBulkTagModalOpen(false)}
                conversationIds={selectedThreadIds}
                onSuccess={() => {
                    setSelectedThreadIds([]);
                    setIsBulkSelecting(false);
                }}
            />
        </div>

    );
}

export default function ConversationsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-full w-full bg-white p-6 items-center justify-center">
                <Loader2 className="animate-spin text-[#2F8F83]" size={24} />
            </div>
        }>
            <ConversationsContent />
        </Suspense>
    );
}
