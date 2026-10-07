"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Save,
  Globe,
  Mail,
  MapPin,
  Phone,
  Lock,
  Camera,
  Info,
  ExternalLink,
  Plus,
  Trash2,
  ShieldCheck,
  Check,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  Smartphone,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WhatsAppBusinessProfileSkeleton } from "@/components/skeletons/WhatsAppBusinessProfileSkeleton";
import {
  useWhatsAppBusinessProfile,
  useUpdateWhatsAppBusinessProfile,
  useUploadWhatsAppBusinessProfilePicture,
  useSyncWhatsAppBusinessProfile,
  type WhatsAppBusinessProfile,
  type UpdateWhatsAppProfilePayload,
} from "@/lib/api-client-react";

export default function WhatsAppBusinessProfilePage() {
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | undefined>(undefined);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [about, setAbout] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("OTHER");
  const [address, setAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [websites, setWebsites] = useState<string[]>([""]);

  // Fetch Profile via TanStack Query
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useWhatsAppBusinessProfile(selectedPhoneId);

  // Mutations
  const updateMutation = useUpdateWhatsAppBusinessProfile();
  const uploadPictureMutation = useUploadWhatsAppBusinessProfilePicture();
  const syncMutation = useSyncWhatsAppBusinessProfile();

  // Populate local form fields when query loads or active phone changes
  useEffect(() => {
    if (profile) {
      setAbout(profile.about || "");
      setDescription(profile.description || "");
      setCategory(profile.category || "OTHER");
      setAddress(profile.address || "");
      setEmail(profile.email || "");
      setWebsites(
        profile.websites && profile.websites.length > 0
          ? [...profile.websites]
          : [""]
      );
      setImagePreviewUrl(profile.profile_picture_url || null);
      setSelectedImageFile(null);

      // Auto-select first phone number ID if multiple exist and none chosen
      if (!selectedPhoneId && profile.phone_number_id) {
        setSelectedPhoneId(profile.phone_number_id);
      }
    }
  }, [profile]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle Photo Picker Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast.error("Invalid image format. Meta supports only JPG, JPEG, and PNG images.");
      return;
    }

    // Validate Max Size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Profile picture must be smaller than 5 MB.");
      return;
    }

    setSelectedImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
  };

  // Upload Photo to Meta directly
  const handleUploadPhoto = async () => {
    if (!selectedImageFile) return;

    const toastId = toast.loading("Uploading profile photo to Meta WhatsApp Cloud...");
    try {
      const res = await uploadPictureMutation.mutateAsync({
        file: selectedImageFile,
        phoneNumberId: selectedPhoneId || profile?.phone_number_id || undefined,
      });

      setSelectedImageFile(null);
      setImagePreviewUrl(res.profile_picture_url || null);
      toast.success("Profile photo successfully uploaded and updated on WhatsApp!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload profile photo to Meta. Please try again.", { id: toastId });
    }
  };

  // Handle Add Website URL
  const handleAddWebsite = () => {
    if (websites.length >= 2) {
      toast.warning("Meta WhatsApp Cloud API allows a maximum of 2 business websites.");
      return;
    }
    setWebsites([...websites, "https://"]);
  };

  // Handle Remove Website URL
  const handleRemoveWebsite = (index: number) => {
    const updated = websites.filter((_, idx) => idx !== index);
    setWebsites(updated.length > 0 ? updated : [""]);
  };

  // Handle Website Value Change
  const handleWebsiteChange = (index: number, value: string) => {
    const updated = [...websites];
    updated[index] = value;
    setWebsites(updated);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    // Frontend Validations
    if (about.length > 139) {
      toast.error("About status must not exceed 139 characters.");
      return;
    }

    if (description.length > 256) {
      toast.error("Business description must not exceed 256 characters.");
      return;
    }

    if (address.length > 256) {
      toast.error("Address must not exceed 256 characters.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please provide a valid email address.");
      return;
    }

    const cleanWebsites = websites
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    for (const site of cleanWebsites) {
      if (!/^https?:\/\/.+/i.test(site)) {
        toast.error(`Website URL "${site}" must start with http:// or https://`);
        return;
      }
      if (site.length > 256) {
        toast.error(`Website URL exceeds the maximum length of 256 characters.`);
        return;
      }
    }

    const payload: UpdateWhatsAppProfilePayload = {
      phone_number_id: selectedPhoneId || profile.phone_number_id || undefined,
      about: about.trim(),
      description: description.trim(),
      category: category,
      address: address.trim(),
      email: email.trim(),
      websites: cleanWebsites,
    };

    const toastId = toast.loading("Updating WhatsApp business profile with Meta...");

    try {
      await updateMutation.mutateAsync(payload);
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
      toast.success("WhatsApp Business Profile updated successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Unable to update profile. Please check your credentials.", { id: toastId });
    }
  };

  // Handle Sync from WhatsApp
  const handleSync = async () => {
    const toastId = toast.loading("Syncing business profile from Meta Cloud API...");
    try {
      await syncMutation.mutateAsync(selectedPhoneId || profile?.phone_number_id || undefined);
      toast.success("Profile refreshed successfully from WhatsApp!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Failed to sync profile from WhatsApp.", { id: toastId });
    }
  };

  // Fallback initial letter for avatar
  const initials = (profile?.business_name || "ST")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-16">
        <PageHeader
          title="WhatsApp Business Profile"
          description="Configure your official WhatsApp Business information, category, About message, and contact channels."
          icon={Building2}
          breadcrumbs={[
            { label: "WhatsApp", href: "/integrations/whatsapp" },
            { label: "Business Profile" },
          ]}
        />
        <WhatsAppBusinessProfileSkeleton />
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="space-y-6 w-full pb-16">
        <PageHeader
          title="WhatsApp Business Profile"
          description="Configure your official WhatsApp Business information, category, About message, and contact channels."
          icon={Building2}
          breadcrumbs={[
            { label: "WhatsApp", href: "/integrations/whatsapp" },
            { label: "Business Profile" },
          ]}
        />
        <Card className="border-rose-200 bg-rose-50/50 rounded-2xl p-8 text-center max-w-2xl mx-auto my-12">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <CardTitle className="text-lg font-bold text-slate-900 mb-2">
            Failed to Load WhatsApp Business Profile
          </CardTitle>
          <p className="text-sm text-slate-600 mb-6">
            {(error as any)?.message ||
              "Unable to connect to WhatsApp Cloud API. Please check your connection or reconnect your WhatsApp account."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => refetch()}
              className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-xl shadow-xs"
            >
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              asChild
              className="rounded-xl border-slate-200"
            >
              <Link href="/integrations/whatsapp">
                Connection Settings
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isConnected = profile?.status === "connected";
  const isNeedsAttention = profile?.status === "needs_attention";
  const isDisconnected = profile?.status === "disconnected" || !profile?.phone_number;

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      <PageHeader
        title="WhatsApp Business Profile"
        description="Manage the profile information, company description, category, and contact details shown to customers on WhatsApp."
        icon={Building2}
        breadcrumbs={[
          { label: "WhatsApp", href: "/integrations/whatsapp" },
          { label: "Business Profile" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending || isDisconnected}
              className="rounded-xl border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 shadow-2xs cursor-pointer"
            >
              <RefreshCw
                size={14}
                className={`mr-2 ${syncMutation.isPending ? "animate-spin text-[#2F8F83]" : ""}`}
              />
              Sync from WhatsApp
            </Button>
          </div>
        }
      />

      {/* WhatsApp Account Switcher & Connection Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${isConnected ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
            isNeedsAttention ? "bg-amber-50 text-amber-600 border border-amber-200" :
              "bg-slate-100 text-slate-500 border border-slate-200"
            }`}>
            <Phone size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm truncate">
                {profile?.phone_number || "No WhatsApp Phone Connected"}
              </span>

              {isConnected && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px] font-semibold">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Connected
                </Badge>
              )}
              {isNeedsAttention && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[11px] font-semibold">
                  <AlertTriangle size={12} className="text-amber-500" />
                  Needs Attention
                </Badge>
              )}
              {isDisconnected && (
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 text-[11px] font-semibold">
                  <XCircle size={12} className="text-rose-500" />
                  Disconnected
                </Badge>
              )}
              {profile?.is_test_mode && (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                  SIMULATED TEST MODE
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-500 truncate mt-0.5">
              {profile?.business_name
                ? `Display Name: ${profile.business_name}`
                : "Connect WhatsApp in Integration settings to configure your profile."}
              {profile?.last_synced_at && (
                <span className="ml-2 text-slate-400">
                  • Synced: {new Date(profile.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Multi-Account Selector if more than 1 connected account */}
        {profile?.available_accounts && profile.available_accounts.length > 1 && (
          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Number:</span>
            <Select
              value={selectedPhoneId || profile.phone_number_id || undefined}
              onValueChange={(val) => setSelectedPhoneId(val)}
            >
              <SelectTrigger className="h-9 min-w-[200px] text-xs font-semibold rounded-xl border-slate-200 bg-slate-50/50">
                <SelectValue placeholder="Select Phone Number" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-slate-200">
                {profile.available_accounts.map((acc) => (
                  <SelectItem key={acc.phone_number_id} value={acc.phone_number_id} className="text-xs">
                    {acc.phone_number} ({acc.display_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* DISCONNECTED EMPTY STATE */}
      {isDisconnected ? (
        <Card className="border-dashed border-2 border-slate-200 bg-white rounded-3xl p-10 text-center max-w-2xl mx-auto my-8 shadow-xs">
          <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#35877D] mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 mb-2">
            WhatsApp Business Account Not Connected
          </CardTitle>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            To customize your WhatsApp Business profile (profile photo, description, category, and customer contact information), you must connect a verified WhatsApp number first.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              className="bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-[#35877D]/20 cursor-pointer"
            >
              <Link href="/integrations/whatsapp">
                <MessageCircle size={18} className="mr-2" />
                Connect WhatsApp Business
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="rounded-xl border-slate-200 text-slate-700 cursor-pointer"
            >
              <RefreshCw size={16} className="mr-2" />
              Check Status
            </Button>
          </div>
        </Card>
      ) : (
        /* MAIN PROFILE EDITOR & LIVE PREVIEW GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: EDITABLE FORM */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card 1: Profile Photo & Official Identity */}
              <Card className="border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Profile Photo & Official Identity
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Your WhatsApp avatar and official Meta verified business name.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 border-slate-200">
                      Step 1
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Photo Upload Area */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                    {/* Avatar Container */}
                    <div className="relative group shrink-0">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-md flex items-center justify-center text-slate-700 font-bold text-2xl">
                        {imagePreviewUrl ? (
                          <img
                            src={imagePreviewUrl}
                            alt="WhatsApp Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="bg-[#35877D] text-white h-full w-full flex items-center justify-center font-bold text-2xl">
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Overlay upload icon */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadPictureMutation.isPending}
                        className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Change profile picture"
                      >
                        <Camera size={22} />
                      </button>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageSelect}
                      className="hidden"
                      aria-label="Upload profile image"
                    />

                    {/* Photo Actions & Notes */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadPictureMutation.isPending}
                          className="rounded-xl border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white shadow-2xs cursor-pointer"
                        >
                          <Camera size={14} className="mr-1.5" />
                          Choose New Photo
                        </Button>

                        {selectedImageFile && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleUploadPhoto}
                            disabled={uploadPictureMutation.isPending}
                            className="bg-[#35877D] hover:bg-[#2b6e66] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                          >
                            {uploadPictureMutation.isPending ? (
                              <>
                                <RefreshCw size={13} className="mr-1.5 animate-spin" />
                                Uploading to Meta...
                              </>
                            ) : (
                              <>
                                <Check size={14} className="mr-1.5" />
                                Save Photo to WhatsApp
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Meta supports <strong className="text-slate-700">JPG, JPEG, and PNG</strong> formats up to <strong className="text-slate-700">5 MB</strong>. The image will be synced through Meta&apos;s Resumable Upload session.
                      </p>

                      {selectedImageFile && (
                        <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/80">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>Selected &quot;{selectedImageFile.name}&quot; — Click &quot;Save Photo to WhatsApp&quot; to apply.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Read-Only Identity Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Business Name (Read-Only) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          Business Name
                          <Lock size={12} className="text-slate-400" />
                        </Label>
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-medium"
                        >
                          Managed by Meta
                        </Badge>
                      </div>
                      <Input
                        value={profile?.business_name || "Sandbox Technology"}
                        readOnly
                        disabled
                        className="bg-slate-50 border-slate-200 text-slate-800 font-semibold cursor-not-allowed rounded-xl"
                      />
                      <p className="text-[11px] text-slate-500 flex items-start gap-1 mt-1">
                        <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>Official display names are reviewed and locked by Meta. To change your name, request a name review in Meta Business Suite.</span>
                      </p>
                    </div>

                    {/* Connected Phone Number (Read-Only) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          WhatsApp Business Phone
                          <Lock size={12} className="text-slate-400" />
                        </Label>
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-medium"
                        >
                          Read Only
                        </Badge>
                      </div>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-3 text-slate-400" />
                        <Input
                          value={profile?.phone_number || "+91 82380 71647"}
                          readOnly
                          disabled
                          className="pl-9 bg-slate-50 border-slate-200 text-slate-800 font-mono font-semibold cursor-not-allowed rounded-xl"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        To connect or register a different WhatsApp number, use the onboarding connection tab.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Business Profile Details */}
              <Card className="border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Profile Details & Contact Info
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        These fields are displayed to customers inside their WhatsApp contact details.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 border-slate-200">
                      Step 2
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Category / Vertical */}
                  <div className="space-y-1.5">
                    <Label htmlFor="category-select" className="text-xs font-semibold text-slate-700">
                      Business Category (Industry Vertical) <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={category}
                      onValueChange={(val) => setCategory(val)}
                    >
                      <SelectTrigger
                        id="category-select"
                        className="h-10 text-xs font-medium rounded-xl border-slate-200 bg-white shadow-2xs"
                      >
                        <SelectValue placeholder="Select Business Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-lg border-slate-200 max-h-72">
                        {profile?.categories?.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value} className="text-xs font-medium py-2">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-500">
                      Select the vertical category that best describes your company on WhatsApp.
                    </p>
                  </div>

                  {/* About Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="about-input" className="text-xs font-semibold text-slate-700">
                        About Status Text
                      </Label>
                      <span
                        className={`text-[11px] font-mono ${about.length > 130
                          ? "text-rose-600 font-bold"
                          : "text-slate-400 font-medium"
                          }`}
                      >
                        {about.length} / 139
                      </span>
                    </div>
                    <Input
                      id="about-input"
                      value={about}
                      onChange={(e) => setAbout(e.target.value.slice(0, 139))}
                      placeholder="e.g. Always here to support your team with intelligent CRM tools."
                      maxLength={139}
                      className="rounded-xl border-slate-200 text-xs shadow-2xs focus-visible:ring-[#35877D]"
                    />
                    <p className="text-[11px] text-slate-500">
                      Quick status line visible right below your name in WhatsApp chat headers (Max 139 characters).
                    </p>
                  </div>

                  {/* Description Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description-input" className="text-xs font-semibold text-slate-700">
                        Business Description
                      </Label>
                      <span
                        className={`text-[11px] font-mono ${description.length > 245
                          ? "text-rose-600 font-bold"
                          : "text-slate-400 font-medium"
                          }`}
                      >
                        {description.length} / 256
                      </span>
                    </div>
                    <Textarea
                      id="description-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 256))}
                      placeholder="e.g. Connectly360 is an enterprise WhatsApp marketing and automated customer messaging platform."
                      maxLength={256}
                      rows={3}
                      className="rounded-xl border-slate-200 text-xs shadow-2xs resize-none focus-visible:ring-[#35877D]"
                    />
                    <p className="text-[11px] text-slate-500">
                      Detailed summary displayed on your WhatsApp Business Info screen (Max 256 characters).
                    </p>
                  </div>

                  {/* Address & Email Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Address */}
                    <div className="space-y-1.5">
                      <Label htmlFor="address-input" className="text-xs font-semibold text-slate-700">
                        Physical Address
                      </Label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3.5 top-3 text-slate-400" />
                        <Input
                          id="address-input"
                          value={address}
                          onChange={(e) => setAddress(e.target.value.slice(0, 256))}
                          maxLength={256}
                          placeholder="e.g. Infocity, Gandhinagar, Gujarat"
                          className="pl-9 rounded-xl border-slate-200 text-xs shadow-2xs focus-visible:ring-[#35877D]"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Physical store, office, or headquarters address.
                      </p>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email-input" className="text-xs font-semibold text-slate-700">
                        Public Support Email
                      </Label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-3 text-slate-400" />
                        <Input
                          id="email-input"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.slice(0, 128))}
                          maxLength={128}
                          placeholder="e.g. contact@sandboxtechnology.in"
                          className="pl-9 rounded-xl border-slate-200 text-xs shadow-2xs focus-visible:ring-[#35877D]"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Email address customers can tap to contact your team.
                      </p>
                    </div>
                  </div>

                  {/* Websites (up to 2) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700">
                        Business Websites (Maximum 2)
                      </Label>
                      {websites.length < 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAddWebsite}
                          className="text-xs font-bold text-[#35877D] hover:bg-teal-50 h-7 px-2.5 rounded-lg cursor-pointer"
                        >
                          <Plus size={13} className="mr-1" />
                          Add Website
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {websites.map((siteUrl, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Globe size={14} className="absolute left-3.5 top-3 text-slate-400" />
                            <Input
                              value={siteUrl}
                              onChange={(e) => handleWebsiteChange(index, e.target.value)}
                              placeholder="https://example.com"
                              maxLength={256}
                              className="pl-9 rounded-xl border-slate-200 text-xs shadow-2xs focus-visible:ring-[#35877D]"
                            />
                          </div>

                          {websites.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveWebsite(index)}
                              className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl shrink-0 p-0 cursor-pointer"
                              title="Remove website"
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Include complete URLs starting with <strong className="text-slate-700">https://</strong> or <strong className="text-slate-700">http://</strong>.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Diagnostics Collapsible */}
              <Collapsible
                open={showTechnicalDetails}
                onOpenChange={setShowTechnicalDetails}
                className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-2xs"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={15} className="text-slate-400" />
                      <span>Technical Account Diagnostics (Read-Only)</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${showTechnicalDetails ? "rotate-180" : ""}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs space-y-3 bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">Phone Number ID</span>
                      <span className="font-mono text-slate-700 text-xs select-all">
                        {profile?.phone_number_id || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">WABA ID</span>
                      <span className="font-mono text-slate-700 text-xs select-all">
                        {profile?.waba_id || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">Quality Rating</span>
                      <span className="text-emerald-700 font-bold text-xs">
                        {profile?.quality_rating || "GREEN"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">Messaging Limit Tier</span>
                      <span className="text-slate-700 font-medium text-xs">
                        {profile?.messaging_limit || "1,000 / day"}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>Access tokens are encrypted at rest and never exposed to the frontend browser interface.</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Form Submission Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSync}
                  disabled={syncMutation.isPending}
                  className="rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs cursor-pointer"
                >
                  <RefreshCw
                    size={14}
                    className={`mr-2 ${syncMutation.isPending ? "animate-spin text-[#35877D]" : ""}`}
                  />
                  Refresh from WhatsApp
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending || isSavedSuccess}
                    className={`rounded-xl px-6 py-2.5 font-bold text-xs shadow-md transition-all cursor-pointer ${isSavedSuccess
                      ? "bg-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-[#35877D] hover:bg-[#2b6e66] text-white shadow-[#35877D]/25"
                      }`}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <RefreshCw size={14} className="mr-2 animate-spin" />
                        Saving to Meta...
                      </>
                    ) : isSavedSuccess ? (
                      <>
                        <Check size={14} className="mr-2" />
                        Saved Successfully!
                      </>
                    ) : (
                      <>
                        <Save size={14} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: LIVE WHATSAPP CLIENT PREVIEW */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smartphone size={15} className="text-[#35877D]" />
                Customer Phone Preview
              </span>
              <Badge variant="secondary" className="text-[10px] bg-teal-50 text-[#35877D] border-teal-200">
                Live Preview
              </Badge>
            </div>

            {/* Mobile Contact Sheet Simulation Card */}
            <div className="bg-slate-900 rounded-3xl p-3 shadow-xl border border-slate-800">
              {/* WhatsApp App Mock Container */}
              <div className="bg-[#111B21] text-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-700/60 font-sans">
                {/* Simulated WhatsApp Navigation Bar */}
                <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 tracking-wide">
                    Business Details
                  </span>
                  <HelpCircle size={14} className="text-slate-400" />
                </div>

                {/* Profile Header Content */}
                <div className="p-6 text-center space-y-3 bg-gradient-to-b from-[#202C33] to-[#111B21] border-b border-slate-800">
                  {/* Avatar */}
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-800 mx-auto border-2 border-slate-600/80 shadow-md flex items-center justify-center">
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="bg-[#35877D] text-white h-full w-full flex items-center justify-center font-bold text-2xl">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Business Name & Official Check */}
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center justify-center gap-1.5">
                      {profile?.business_name || "Sandbox Technology"}
                      <CheckCircle2 size={16} className="text-[#00A884] fill-[#00A884] text-[#111B21]" />
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {profile?.phone_number || "+91 82380 71647"}
                    </p>
                  </div>

                  {/* Vertical Category Tag */}
                  <div>
                    <span className="inline-block px-3 py-1 bg-[#202C33] text-[#00A884] text-[11px] font-semibold rounded-full border border-slate-700">
                      {profile?.categories?.find((c) => c.value === category)?.label || "Other"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Mock */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#111B21] border-b border-slate-800">
                  <div className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#202C33] text-slate-300 hover:text-white transition-colors">
                    <MessageCircle size={18} className="text-[#00A884] mb-1" />
                    <span className="text-[10px] font-medium">Message</span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#202C33] text-slate-300 hover:text-white transition-colors">
                    <Phone size={18} className="text-[#00A884] mb-1" />
                    <span className="text-[10px] font-medium">Call</span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#202C33] text-slate-300 hover:text-white transition-colors">
                    <Globe size={18} className="text-[#00A884] mb-1" />
                    <span className="text-[10px] font-medium">Catalog</span>
                  </div>
                </div>

                {/* Information Sections */}
                <div className="p-4 space-y-4 text-xs">
                  {/* About Message */}
                  {about && (
                    <div className="space-y-1 bg-[#202C33]/70 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        About
                      </span>
                      <p className="text-slate-200 text-xs leading-relaxed italic">
                        &quot;{about}&quot;
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {description && (
                    <div className="space-y-1 bg-[#202C33]/70 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Description
                      </span>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {description}
                      </p>
                    </div>
                  )}

                  {/* Address */}
                  {address && (
                    <div className="flex items-start gap-3 bg-[#202C33]/70 p-3 rounded-xl border border-slate-800">
                      <MapPin size={16} className="text-[#00A884] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Address
                        </span>
                        <p className="text-slate-200 text-xs">{address}</p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {email && (
                    <div className="flex items-start gap-3 bg-[#202C33]/70 p-3 rounded-xl border border-slate-800">
                      <Mail size={16} className="text-[#00A884] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Email
                        </span>
                        <p className="text-[#00A884] text-xs truncate underline">{email}</p>
                      </div>
                    </div>
                  )}

                  {/* Websites */}
                  {websites.filter((w) => w.trim().length > 0).length > 0 && (
                    <div className="flex items-start gap-3 bg-[#202C33]/70 p-3 rounded-xl border border-slate-800">
                      <Globe size={16} className="text-[#00A884] shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Websites
                        </span>
                        {websites
                          .filter((w) => w.trim().length > 0)
                          .map((site, idx) => (
                            <a
                              key={idx}
                              href={site}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#00A884] text-xs block truncate hover:underline flex items-center gap-1"
                            >
                              <span className="truncate">{site}</span>
                              <ExternalLink size={10} className="shrink-0" />
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer disclaimer */}
                <div className="p-3 bg-[#202C33] text-center border-t border-slate-800 text-[10px] text-slate-400">
                  Meta WhatsApp Cloud API is the authoritative source of truth.
                </div>
              </div>
            </div>

            {/* Explanatory callout */}
            <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed border border-slate-200 flex items-start gap-2">
              <Sparkles size={14} className="text-[#35877D] shrink-0 mt-0.5" />
              <span>
                <strong>Accurate Live Mirror:</strong> Customers interacting with your business on WhatsApp Web, Android, and iOS will view these verified profile attributes.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
