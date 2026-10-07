"use client";

import React from "react";
import { MapPin, ExternalLink, Navigation } from "lucide-react";

interface LocationMessageBubbleProps {
    latitude?: number | null;
    longitude?: number | null;
    locationName?: string | null;
    locationAddress?: string | null;
    isInbound: boolean;
}

export function LocationMessageBubble({
    latitude,
    longitude,
    locationName,
    locationAddress,
    isInbound,
}: LocationMessageBubbleProps) {
    const lat = latitude ?? 0;
    const lng = longitude ?? 0;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    return (
        <div className="overflow-hidden rounded-xl bg-white border border-slate-200/90 shadow-2xs max-w-[280px] sm:max-w-[320px]">
            {/* Visual map preview header */}
            <div className="h-24 bg-gradient-to-br from-emerald-100 via-teal-50 to-blue-100 relative flex items-center justify-center border-b border-slate-200/60 p-3 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2F8F83_1px,transparent_1px)] [background-size:12px_12px]" />
                <div className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center text-rose-500 z-10 animate-bounce">
                    <MapPin size={22} className="fill-rose-500 text-white" />
                </div>
            </div>

            {/* Location Details */}
            <div className="p-3 space-y-2">
                <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug truncate">
                        {locationName || "Shared Location"}
                    </h4>
                    {locationAddress && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                            {locationAddress}
                        </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {lat.toFixed(5)}, {lng.toFixed(5)}
                    </p>
                </div>

                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-[#2F8F83]/10 hover:bg-[#2F8F83]/20 text-[#2F8F83] text-xs font-semibold transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Navigation size={12} />
                    <span>Open in Maps</span>
                    <ExternalLink size={11} className="ml-0.5 opacity-70" />
                </a>
            </div>
        </div>
    );
}
