"use client";

import { useState } from "react";
import { Building2, Save, Globe, Phone, MapPin, Briefcase, Upload, Camera, X, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CompanyProfilePage() {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [companyName, setCompanyName] = useState("Connectly360");
    const [industry, setIndustry] = useState("SaaS / Technology");
    const [website, setWebsite] = useState("https://connectly360.com");
    const [phone, setPhone] = useState("+91 98765 43210");
    const [address, setAddress] = useState("123 Business Park, Mumbai, Maharashtra, India");
    const [companySize, setCompanySize] = useState("11-50");
    const [foundedYear, setFoundedYear] = useState("2020");
    const [description, setDescription] = useState("Empowering businesses with multi-channel messaging and AI automation.");

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Company profile updated successfully!");
        }, 1200);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Building2}
                title="Company Profile"
                description="Manage your company information, branding assets, and organizational details."
            />

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
                                        <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-[#378179] transition-colors">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Company Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 group-hover:text-[#378179] transition-colors gap-1.5">
                                                    <Upload size={24} />
                                                    <span className="text-[11px] font-semibold">Upload Logo</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                                        Recommended format: PNG or JPG<br />
                                        Max file size: 2MB (200x200px)
                                    </p>
                                    {logoPreview && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setLogoPreview(null)}
                                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 rounded-xl flex items-center gap-1 cursor-pointer"
                                        >
                                            <X size={14} />
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
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Building2 size={13} className="text-[#378179]" />
                                            Company Name
                                        </label>
                                        <Input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Briefcase size={13} className="text-blue-500" />
                                            Industry
                                        </label>
                                        <Input
                                            type="text"
                                            value={industry}
                                            onChange={(e) => setIndustry(e.target.value)}
                                            className="h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Globe size={13} className="text-emerald-500" />
                                            Website URL
                                        </label>
                                        <Input
                                            type="url"
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Phone size={13} className="text-purple-500" />
                                            Business Phone
                                        </label>
                                        <Input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                        />
                                    </div>

                                    <div className="sm:col-span-2 space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <MapPin size={13} className="text-amber-500" />
                                            Address
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#378179] transition-all resize-none"
                                        />
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
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Company Size</label>
                                        <select
                                            value={companySize}
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

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Founded Year</label>
                                        <Input
                                            type="number"
                                            value={foundedYear}
                                            onChange={(e) => setFoundedYear(e.target.value)}
                                            className="h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                        />
                                    </div>

                                    <div className="sm:col-span-2 space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Company Description</label>
                                        <textarea
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#378179] transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Submit bar */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-4 rounded-xl text-xs font-semibold border-slate-200 text-slate-600 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-[#378179] hover:bg-[#2c6f66] text-white text-xs h-9 px-5 rounded-xl border-0 font-semibold cursor-pointer shadow-xs"
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
        </div>
    );
}
