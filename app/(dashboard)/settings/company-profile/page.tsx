"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Building2,
    Save,
    Globe,
    Phone,
    MapPin,
    Briefcase,
    Upload,
    Camera,
    X,
    Loader2,
    AlertCircle,
    ShieldAlert
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import {
    useCompanyProfile,
    useUpdateCompanyProfile,
    useUploadCompanyLogo,
    useRemoveCompanyLogo,
    CompanyProfile
} from "@/lib/api-client-react";

export default function CompanyProfilePage() {
    const { user } = useAuth();
    const { can, isOwner } = usePermissions();

    const canEdit = isOwner || can("workspace.update") || can("settings.update");

    // Fetch dynamic company profile for active workspace
    const {
        data: profile,
        isLoading,
        isError,
        refetch
    } = useCompanyProfile(user?.tenant_id);

    const updateMutation = useUpdateCompanyProfile(user?.tenant_id);
    const uploadLogoMutation = useUploadCompanyLogo(user?.tenant_id);
    const removeLogoMutation = useRemoveCompanyLogo(user?.tenant_id);

    // Form states
    const [companyName, setCompanyName] = useState("");
    const [industry, setIndustry] = useState("");
    const [website, setWebsite] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [companySize, setCompanySize] = useState("11-50");
    const [foundedYear, setFoundedYear] = useState("");
    const [description, setDescription] = useState("");

    // Logo & dialog state
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    // Populate form fields whenever backend data changes
    useEffect(() => {
        if (profile) {
            setCompanyName(profile.company_name || "");
            setIndustry(profile.industry || "");
            setWebsite(profile.website_url || "");
            setPhone(profile.business_phone || "");
            setAddress(profile.address || "");
            setCompanySize(profile.company_size || "11-50");
            setFoundedYear(profile.founded_year ? String(profile.founded_year) : "");
            setDescription(profile.description || "");
            setLogoPreview(profile.logo_url || null);
            setFieldErrors({});
        }
    }, [profile]);

    // Track dirty / unsaved changes against saved profile
    const isDirty = useMemo(() => {
        if (!profile) return false;
        return (
            companyName !== (profile.company_name || "") ||
            industry !== (profile.industry || "") ||
            website !== (profile.website_url || "") ||
            phone !== (profile.business_phone || "") ||
            address !== (profile.address || "") ||
            companySize !== (profile.company_size || "11-50") ||
            foundedYear !== (profile.founded_year ? String(profile.founded_year) : "") ||
            description !== (profile.description || "")
        );
    }, [
        profile,
        companyName,
        industry,
        website,
        phone,
        address,
        companySize,
        foundedYear,
        description
    ]);

    // Revert form back to last saved backend state
    const handleCancel = () => {
        if (profile) {
            setCompanyName(profile.company_name || "");
            setIndustry(profile.industry || "");
            setWebsite(profile.website_url || "");
            setPhone(profile.business_phone || "");
            setAddress(profile.address || "");
            setCompanySize(profile.company_size || "11-50");
            setFoundedYear(profile.founded_year ? String(profile.founded_year) : "");
            setDescription(profile.description || "");
            setLogoPreview(profile.logo_url || null);
            setFieldErrors({});
            toast.info("Changes reverted to saved profile.");
        }
    };

    // Handle Logo Upload with client-side validation
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value to allow selecting same file again if needed
        e.target.value = "";

        // Client validation: Max 2MB
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size exceeds 2MB limit. Please upload a smaller image.");
            return;
        }

        // Allowed formats
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast.error("Unsupported file format. Please upload PNG, JPG, or WEBP.");
            return;
        }

        // Optimistic local preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        try {
            const updated = await uploadLogoMutation.mutateAsync(file);
            setLogoPreview(updated.logo_url || null);
            toast.success("Company logo uploaded successfully.");
        } catch (err: any) {
            // Revert back to original on failure
            setLogoPreview(profile?.logo_url || null);
            const msg = err.errors?.logo?.[0] || err.message || "Failed to upload logo.";
            toast.error(msg);
        }
    };

    // Handle Logo Removal
    const handleConfirmRemoveLogo = async () => {
        try {
            await removeLogoMutation.mutateAsync();
            setLogoPreview(null);
            toast.success("Company logo removed successfully.");
        } catch (err: any) {
            toast.error(err.message || "Failed to remove logo.");
        }
    };

    // Save profile changes to backend
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) {
            toast.error("You do not have permission to modify this company profile.");
            return;
        }

        setFieldErrors({});

        const payload: Partial<CompanyProfile> = {
            company_name: companyName.trim(),
            industry: industry.trim() || null,
            website_url: website.trim() || null,
            business_phone: phone.trim() || null,
            address: address.trim() || null,
            company_size: companySize || null,
            founded_year: foundedYear ? parseInt(foundedYear, 10) : null,
            description: description.trim() || null,
        };

        try {
            await updateMutation.mutateAsync(payload);
            toast.success("Company profile updated successfully.");
        } catch (err: any) {
            if (err.errors) {
                setFieldErrors(err.errors);
                const firstErr = Object.values(err.errors)[0] as string[];
                toast.error(firstErr?.[0] || "Please correct the highlighted errors.");
            } else {
                toast.error(err.message || "Unable to update company profile.");
            }
        }
    };

    // Loading Skeleton
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4">
                        <Card className="border border-[#EAE6DF] bg-white rounded-2xl overflow-hidden p-6 space-y-4">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-48" />
                            <div className="flex flex-col items-center gap-4 py-4">
                                <Skeleton className="w-32 h-32 rounded-2xl" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <Card className="border border-[#EAE6DF] bg-white rounded-2xl overflow-hidden p-6 space-y-4">
                            <Skeleton className="h-5 w-36" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <Skeleton className="h-10 rounded-xl" />
                                <Skeleton className="h-10 rounded-xl" />
                                <Skeleton className="h-10 rounded-xl" />
                                <Skeleton className="h-10 rounded-xl" />
                                <Skeleton className="h-20 sm:col-span-2 rounded-xl" />
                            </div>
                        </Card>

                        <Card className="border border-[#EAE6DF] bg-white rounded-2xl overflow-hidden p-6 space-y-4">
                            <Skeleton className="h-5 w-40" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <Skeleton className="h-10 rounded-xl" />
                                <Skeleton className="h-10 rounded-xl" />
                                <Skeleton className="h-24 sm:col-span-2 rounded-xl" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader
                    icon={Building2}
                    title="Company Profile"
                    description="Manage your company information, branding assets, and organizational details."
                />
                <ErrorState
                    title="Unable to load company profile"
                    description="We were unable to retrieve the company profile for this workspace. Please verify your connection or try again."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const isSaving = updateMutation.isPending;
    const isUploadingLogo = uploadLogoMutation.isPending;
    const isRemovingLogo = removeLogoMutation.isPending;

    return (
        <div className="space-y-6 font-sans">
            <PageHeader
                icon={Building2}
                title="Company Profile"
                description="Manage your company information, branding assets, and organizational details."
            />

            {!canEdit && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs font-semibold">
                    <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                    <span>
                        Read-only workspace mode: You do not have permission to modify company branding or profile settings. Contact a workspace owner or administrator.
                    </span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Company Logo */}
                    <div className="lg:col-span-4">
                        <Card className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Camera size={18} className="text-[#378179]" />
                                    Company Logo
                                </CardTitle>
                                <CardDescription className="text-slate-500 text-sm mt-0.5">
                                    Branding icon displayed on customer invoices and chats.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-[#378179] transition-colors relative">
                                            {isUploadingLogo ? (
                                                <div className="flex flex-col items-center gap-2 text-[#378179]">
                                                    <Loader2 className="animate-spin" size={24} />
                                                    <span className="text-[10px] font-bold">Uploading...</span>
                                                </div>
                                            ) : logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="Company Logo"
                                                    className="w-full h-full object-contain p-1"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 group-hover:text-[#378179] transition-colors gap-1.5">
                                                    <Upload size={24} />
                                                    <span className="text-[11px] font-semibold">Upload Logo</span>
                                                </div>
                                            )}
                                        </div>

                                        {canEdit && !isUploadingLogo && (
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                                onChange={handleLogoUpload}
                                                disabled={!canEdit || isUploadingLogo}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                title="Upload company logo"
                                            />
                                        )}
                                    </div>

                                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                                        Recommended format: PNG or JPG<br />
                                        Max file size: 2MB (200x200px)
                                    </p>

                                    {logoPreview && canEdit && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={isRemovingLogo || isUploadingLogo}
                                            onClick={() => setIsRemoveDialogOpen(true)}
                                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 rounded-xl flex items-center gap-1 cursor-pointer"
                                        >
                                            {isRemovingLogo ? (
                                                <Loader2 className="animate-spin" size={14} />
                                            ) : (
                                                <X size={14} />
                                            )}
                                            Remove Logo
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Company Information */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Briefcase size={18} className="text-[#378179]" />
                                    General Details
                                </CardTitle>
                                <CardDescription className="text-slate-500 text-sm mt-0.5">
                                    Core business contact information and identity.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Company Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Building2 size={13} className="text-[#378179]" />
                                            Company Name
                                        </label>
                                        <Input
                                            type="text"
                                            value={companyName}
                                            disabled={!canEdit}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className={`h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white ${
                                                fieldErrors.company_name ? "border-rose-400 focus:ring-rose-400" : ""
                                            }`}
                                            required
                                        />
                                        {fieldErrors.company_name && (
                                            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />
                                                {fieldErrors.company_name[0]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Industry */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Briefcase size={13} className="text-blue-500" />
                                            Industry
                                        </label>
                                        <Input
                                            type="text"
                                            value={industry}
                                            disabled={!canEdit}
                                            onChange={(e) => setIndustry(e.target.value)}
                                            placeholder="e.g. SaaS / Technology"
                                            className={`h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white ${
                                                fieldErrors.industry ? "border-rose-400 focus:ring-rose-400" : ""
                                            }`}
                                        />
                                        {fieldErrors.industry && (
                                            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />
                                                {fieldErrors.industry[0]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Website URL */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Globe size={13} className="text-emerald-500" />
                                            Website URL
                                        </label>
                                        <Input
                                            type="text"
                                            value={website}
                                            disabled={!canEdit}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            placeholder="https://example.com"
                                            className={`h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white ${
                                                fieldErrors.website_url ? "border-rose-400 focus:ring-rose-400" : ""
                                            }`}
                                        />
                                        {fieldErrors.website_url && (
                                            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />
                                                {fieldErrors.website_url[0]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Business Phone */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Phone size={13} className="text-purple-500" />
                                            Business Phone
                                        </label>
                                        <Input
                                            type="tel"
                                            value={phone}
                                            disabled={!canEdit}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className={`h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white ${
                                                fieldErrors.business_phone ? "border-rose-400 focus:ring-rose-400" : ""
                                            }`}
                                        />
                                        {fieldErrors.business_phone && (
                                            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />
                                                {fieldErrors.business_phone[0]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <MapPin size={13} className="text-amber-500" />
                                            Address
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={address}
                                            disabled={!canEdit}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Full address for invoicing and business identity"
                                            className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#378179] transition-all resize-none ${
                                                fieldErrors.address ? "border-rose-400 focus:ring-rose-400" : ""
                                            }`}
                                        />
                                        {fieldErrors.address && (
                                            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />
                                                {fieldErrors.address[0]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-[#EAE6DF] bg-white shadow-xs rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Building2 size={18} className="text-[#378179]" />
                                    Organization Profile
                                </CardTitle>
                                <CardDescription className="text-slate-500 text-sm mt-0.5">
                                    Company size, founding history, and public summary.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Company Size */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Company Size</label>
                                        <select
                                            value={companySize}
                                            disabled={!canEdit}
                                            onChange={(e) => setCompanySize(e.target.value)}
                                            className="h-9 w-full border border-slate-200 rounded-xl px-3 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#378179]"
                                        >
                                            <option value="1-10">1-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="201-500">201-500 employees</option>
                                            <option value="500+">500+ employees</option>
                                        </select>
                                    </div>

                                    {/* Founded Year */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Founded Year</label>
                                        <Input
                                            type="number"
                                            value={foundedYear}
                                            disabled={!canEdit}
                                            placeholder="e.g. 2020"
                                            min={1900}
                                            max={new Date().getFullYear()}
                                            onChange={(e) => setFoundedYear(e.target.value)}
                                            className={`h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white ${
                                                fieldErrors.founded_year ? "border-rose-400 focus:ring-rose-400" : ""
                                            }`}
                                        />
                                        {fieldErrors.founded_year && (
                                            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />
                                                {fieldErrors.founded_year[0]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Company Description */}
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Company Description</label>
                                        <textarea
                                            rows={3}
                                            value={description}
                                            disabled={!canEdit}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Short summary of business services and purpose"
                                            className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#378179] transition-all resize-none ${
                                                fieldErrors.description ? "border-rose-400 focus:ring-rose-400" : ""
                                            }`}
                                        />
                                        {fieldErrors.description && (
                                            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />
                                                {fieldErrors.description[0]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!isDirty || isSaving}
                        onClick={handleCancel}
                        className="h-9 px-4 rounded-xl text-xs font-semibold border-slate-200 text-slate-600 cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!isDirty || isSaving || !canEdit}
                        className="bg-[#378179] hover:bg-[#2c6f66] text-white text-xs h-9 px-5 rounded-xl border-0 font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin mr-1.5" size={14} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={14} className="mr-1.5" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Confirm Logo Removal Dialog */}
            <ConfirmDialog
                open={isRemoveDialogOpen}
                onOpenChange={setIsRemoveDialogOpen}
                title="Remove Company Logo?"
                description="Are you sure you want to remove your company logo? This will revert customer invoices and chats to the default brand avatar."
                confirmText="Remove Logo"
                cancelText="Keep Logo"
                variant="destructive"
                loading={isRemovingLogo}
                onConfirm={handleConfirmRemoveLogo}
            />
        </div>
    );
}
