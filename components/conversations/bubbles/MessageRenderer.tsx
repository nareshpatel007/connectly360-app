"use client";

import React, { useState } from "react";
import {
    CheckCheck,
    Clock,
    AlertCircle,
    Reply,
    Smile,
    Bot,
} from "lucide-react";
import { formatMessageTime } from "@/lib/date-utils";
import { TextMessageBubble } from "./TextMessageBubble";
import { ImageMessageBubble } from "./ImageMessageBubble";
import { VideoMessageBubble } from "./VideoMessageBubble";
import { AudioMessageBubble } from "./AudioMessageBubble";
import { DocumentMessageBubble } from "./DocumentMessageBubble";
import { StickerMessageBubble } from "./StickerMessageBubble";
import { LocationMessageBubble } from "./LocationMessageBubble";
import { ContactMessageBubble } from "./ContactMessageBubble";
import { InteractiveMessageBubble } from "./InteractiveMessageBubble";
import { TemplateMessageBubble } from "./TemplateMessageBubble";
import { OrderMessageBubble } from "./OrderMessageBubble";
import { SystemMessageBubble, UnsupportedMessageBubble } from "./SystemMessageBubble";
import { QuotedMessagePreview } from "./QuotedMessagePreview";
import { ReactionPill, ReactionPicker } from "./ReactionPill";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageRendererProps {
    conv: any;
    activeCustomerName?: string;
    activeCustomerPhone?: string;
    onReply?: (conv: any) => void;
    onReact?: (conv: any, emoji: string) => void;
    currentUserId?: number | string;
}

export function MessageRenderer({
    conv,
    activeCustomerName,
    activeCustomerPhone,
    onReply,
    onReact,
    currentUserId,
}: MessageRendererProps) {
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    // 1. Skip rendering standalone reaction messages as bubbles (they attach to parent messages)
    if (conv.type === "reaction") {
        return null;
    }

    // 2. System Messages
    if (conv.type === "system") {
        return <SystemMessageBubble message={conv.message || "System notification"} />;
    }

    const isInbound = conv.direction === "inbound";

    // Normalize type
    const rawType = (conv.type || conv.mediaType || conv.media_type || "").toLowerCase();
    const mediaUrl = conv.mediaUrl || conv.media_url;
    const filename = conv.mediaFilename || conv.media_filename || conv.filename;
    const mimeType = conv.mediaMimeType || conv.media_mime_type;
    const mediaSize = conv.mediaSize || conv.media_size;
    const caption = conv.caption;
    const messageText = conv.message || conv.body || "";

    // Determine normalized type if unspecified
    let effectiveType = rawType;
    if (!effectiveType || effectiveType === "unknown") {
        if (mediaUrl) {
            if (mimeType?.includes("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaUrl)) effectiveType = "image";
            else if (mimeType?.includes("video") || /\.(mp4|3gp|mov)$/i.test(mediaUrl)) effectiveType = "video";
            else if (mimeType?.includes("audio") || /\.(mp3|ogg|wav|aac|m4a)$/i.test(mediaUrl)) effectiveType = "audio";
            else effectiveType = "document";
        } else if (conv.latitude !== undefined && conv.latitude !== null && conv.latitude !== "") {
            effectiveType = "location";
        } else if (conv.contacts && Array.isArray(conv.contacts)) {
            effectiveType = "contacts";
        } else if (conv.interactiveData || conv.interactive_data || conv.interactiveType || conv.interactive_type) {
            effectiveType = "interactive";
        } else if (conv.templateName || conv.template_name) {
            effectiveType = "template";
        } else if (conv.orderData || conv.order_data) {
            effectiveType = "order";
        } else {
            effectiveType = "text";
        }
    }

    // Is Sticker (renders borderless)
    const isSticker = effectiveType === "sticker";

    // Quoted message context
    const hasQuotedMessage = Boolean(
        conv.quotedMessage ||
        conv.replyToMessageId ||
        conv.reply_to_message_id ||
        conv.contextMessageId ||
        conv.context_message_id
    );

    const renderContentBubble = () => {
        switch (effectiveType) {
            case "image":
                return (
                    <ImageMessageBubble
                        mediaUrl={mediaUrl}
                        caption={caption || messageText}
                        filename={filename}
                        size={mediaSize}
                        isInbound={isInbound}
                    />
                );
            case "video":
                return (
                    <VideoMessageBubble
                        mediaUrl={mediaUrl}
                        caption={caption || messageText}
                        filename={filename}
                        size={mediaSize}
                        isInbound={isInbound}
                    />
                );
            case "audio":
            case "voice":
                return (
                    <AudioMessageBubble
                        mediaUrl={mediaUrl}
                        isVoice={effectiveType === "voice" || Boolean(conv.is_voice)}
                        duration={conv.duration}
                        filename={filename}
                        isInbound={isInbound}
                    />
                );
            case "document":
                return (
                    <DocumentMessageBubble
                        mediaUrl={mediaUrl}
                        filename={filename}
                        size={mediaSize}
                        mimeType={mimeType}
                        caption={caption || (messageText !== filename ? messageText : null)}
                        isInbound={isInbound}
                    />
                );
            case "sticker":
                return <StickerMessageBubble mediaUrl={mediaUrl} isInbound={isInbound} />;
            case "location":
                return (
                    <LocationMessageBubble
                        latitude={Number(conv.latitude)}
                        longitude={Number(conv.longitude)}
                        locationName={conv.locationName || conv.location_name}
                        locationAddress={conv.locationAddress || conv.location_address}
                        isInbound={isInbound}
                    />
                );
            case "contacts":
                return (
                    <ContactMessageBubble
                        contactData={conv.contacts || conv.contact_data}
                        isInbound={isInbound}
                    />
                );
            case "interactive":
            case "button":
                return (
                    <InteractiveMessageBubble
                        interactiveType={conv.interactiveType || conv.interactive_type}
                        interactiveData={conv.interactiveData || conv.interactive_data}
                        bodyText={messageText}
                        isInbound={isInbound}
                    />
                );
            case "template":
                return (
                    <TemplateMessageBubble
                        templateName={conv.templateName || conv.template_name}
                        templateData={conv.templateData || conv.template_data}
                        bodyText={messageText}
                        isInbound={isInbound}
                    />
                );
            case "order":
                return (
                    <OrderMessageBubble
                        orderData={conv.orderData || conv.order_data}
                        isInbound={isInbound}
                    />
                );
            case "text":
                return <TextMessageBubble text={messageText} isInbound={isInbound} />;
            default:
                return <UnsupportedMessageBubble rawType={effectiveType} messageText={messageText} />;
        }
    };

    const status = (conv.status || "delivered").toLowerCase();

    return (
        <div className={`group/msg flex ${isInbound ? "justify-start" : "justify-end"} relative my-1`}>
            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isInbound ? "items-start" : "items-end"}`}>
                {/* Bubble Container */}
                <div className="relative inline-block max-w-full">
                    {/* Hover Floating Action Bar (Reaction + Reply) */}
                    <div
                        className={`absolute -top-7 ${
                            isInbound ? "left-2" : "right-2"
                        } opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 z-20 bg-white/95 backdrop-blur-xs shadow-xs border border-slate-200 rounded-full px-1.5 py-0.5`}
                    >
                        {/* Quick Reaction Trigger */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowReactionPicker(!showReactionPicker)}
                                className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                                title="React"
                            >
                                <Smile size={13} />
                            </button>
                            {showReactionPicker && (
                                <div className="absolute bottom-full mb-1 left-0 z-30">
                                    <ReactionPicker
                                        onSelectEmoji={(emoji) => {
                                            onReact?.(conv, emoji);
                                            setShowReactionPicker(false);
                                        }}
                                        onClose={() => setShowReactionPicker(false)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Reply Trigger */}
                        {onReply && (
                            <button
                                type="button"
                                onClick={() => onReply(conv)}
                                className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Reply"
                            >
                                <Reply size={13} />
                            </button>
                        )}
                    </div>

                    {/* Bubble Content Box */}
                    <div
                        className={`relative rounded-2xl select-text transition-all ${
                            isSticker
                                ? "bg-transparent border-0 p-0 shadow-none"
                                : isInbound
                                ? "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs px-3.5 py-2.5"
                                : "bg-[#eef6f5] text-slate-800 border border-[#d3e8e5] rounded-tr-xs shadow-2xs px-3.5 py-2.5"
                        }`}
                    >
                        {/* Quoted Message Header if replying */}
                        {hasQuotedMessage && (
                            <QuotedMessagePreview
                                senderName={conv.quotedMessage?.senderName || (isInbound ? "You" : activeCustomerName)}
                                messageText={conv.quotedMessage?.message || conv.context_message_preview || "Quoted message"}
                                mediaType={conv.quotedMessage?.type}
                                direction={isInbound ? "outbound" : "inbound"}
                            />
                        )}

                        {/* Message Main Body */}
                        {renderContentBubble()}

                        {/* Attached Reaction Pill Badge */}
                        {Array.isArray(conv.reactions) && conv.reactions.length > 0 && (
                            <ReactionPill
                                reactions={conv.reactions}
                                onReact={(emoji) => onReact?.(conv, emoji)}
                                currentUserId={currentUserId}
                                isInbound={isInbound}
                            />
                        )}
                    </div>

                    {/* Footer Info (Timestamp & Status Icon) */}
                    <div
                        className={`flex items-center gap-1.5 px-1 text-[10px] text-slate-400 select-none ${
                            Array.isArray(conv.reactions) && conv.reactions.length > 0 ? "mt-3" : "mt-1"
                        }`}
                    >
                        {isInbound && activeCustomerName && (
                            <span className="text-[#2F8F83] font-semibold">{activeCustomerName}</span>
                        )}
                        <span>{formatMessageTime(conv.createdAt || conv.created_at)}</span>

                        {!isInbound && (
                            <span className="flex items-center gap-0.5">
                                {conv.intent === "automation_reply" || conv.intent === "ai" ? (
                                    <span className="text-[10px] text-[#2F8F83] font-medium flex items-center gap-0.5 mr-1">
                                        <Bot size={10} /> Bot
                                    </span>
                                ) : null}

                                {status === "read" ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="text-[#34b7f1] flex items-center" title="Read">
                                                    <CheckCheck size={13} />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-[11px]">Read by recipient</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : status === "delivered" ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="text-[#2F8F83] flex items-center" title="Delivered">
                                                    <CheckCheck size={13} />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-[11px]">Delivered to WhatsApp</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : status === "sent" ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="text-slate-400 flex items-center" title="Sent">
                                                    <CheckCheck size={13} />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-[11px]">Sent to Meta Cloud API</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : status === "failed" ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="text-rose-500 font-bold flex items-center gap-0.5" title="Failed">
                                                    <AlertCircle size={12} />
                                                    <span>Failed</span>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-[11px] text-rose-500 font-semibold">
                                                    {conv.errorMessage || conv.error_message || "Message delivery failed"}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <span className="text-slate-400 flex items-center" title="Sending...">
                                        <Clock size={11} />
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
