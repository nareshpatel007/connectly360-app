"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSendLocation: (data: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    }) => void;
}

export function LocationPickerDialog({
    open,
    onOpenChange,
    onSendLocation,
}: LocationPickerDialogProps) {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState<string>("");
    const [longitude, setLongitude] = useState<string>("");
    const [isLocating, setIsLocating] = useState(false);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({
                title: "Not Supported",
                description: "Geolocation is not supported by your browser.",
                variant: "destructive",
            });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setIsLocating(false);
                setLatitude(pos.coords.latitude.toFixed(6));
                setLongitude(pos.coords.longitude.toFixed(6));
                if (!name) setName("");
                toast({
                    title: "Location Acquired",
                    description: `Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
                });
            },
            (err) => {
                setIsLocating(false);
                toast({
                    title: "Location Error",
                    description: err.message || "Failed to retrieve location",
                    variant: "destructive",
                });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSend = () => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            toast({
                title: "Invalid Coordinates",
                description: "Please provide valid latitude (-90 to 90) and longitude (-180 to 180).",
                variant: "destructive",
            });
            return;
        }

        onSendLocation({
            latitude: lat,
            longitude: lng,
            name: name.trim() || undefined,
            address: address.trim() || undefined,
        });

        onOpenChange(false);
        setName("");
        setAddress("");
        setLatitude("");
        setLongitude("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-5 bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                        <MapPin size={18} className="text-[#2F8F83]" />
                        <span>Share Location</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Get current location button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        className="w-full flex items-center justify-center gap-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 h-9"
                    >
                        {isLocating ? (
                            <Loader2 size={14} className="animate-spin text-[#2F8F83]" />
                        ) : (
                            <Navigation size={14} className="text-[#2F8F83]" />
                        )}
                        <span>Use My Current Location</span>
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Latitude *</Label>
                            <Input
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="e.g. 19.0760"
                                className="h-8 text-xs font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Longitude *</Label>
                            <Input
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="e.g. 72.8777"
                                className="h-8 text-xs font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Place / Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Connectly360 Office"
                            className="h-8 text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Address Details</Label>
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g. BKC, Bandra East, Mumbai"
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
                        disabled={!latitude || !longitude}
                        className="h-8 text-xs bg-[#2F8F83] hover:bg-[#267A70] text-white"
                    >
                        Send Location
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
