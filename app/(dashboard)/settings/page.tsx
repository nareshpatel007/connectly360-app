"use client";

import { useEffect, useState } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Building2, Phone, Truck, Clock, Webhook, Copy, Check } from "lucide-react";

const settingsSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    contactNumber: z.string().optional(),
    deliveryInformation: z.string().optional(),
    businessHours: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: settings, isLoading } = useGetSettings();
    const updateSettings = useUpdateSettings();
    const [origin, setOrigin] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin);
        }
    }, []);

    const form = useForm<SettingsForm>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            companyName: "",
            contactNumber: "",
            deliveryInformation: "",
            businessHours: "",
        },
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                companyName: settings.companyName ?? "",
                contactNumber: settings.contactNumber ?? "",
                deliveryInformation: settings.deliveryInformation ?? "",
                businessHours: settings.businessHours ?? "",
            });
        }
    }, [settings, form]);

    function onSubmit(data: SettingsForm) {
        updateSettings.mutate(
            { data },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
                    toast({ title: "Settings saved", description: "Your business settings have been updated." });
                },
                onError: () => {
                    toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
                },
            }
        );
    }

    return (
        <div className="space-y-6 w-full">
            <PageHeader
                icon={Building2}
                title="Business Settings"
                description="Configure your business profile, operating hours, and customer auto-reply information."
                breadcrumbs={[{ label: "Settings" }]}
            />

            <Card className="border border-[#E5E9EE] bg-white rounded-xl shadow-2xs overflow-hidden">
                <CardHeader className="border-b border-[#E5E9EE] pb-4">
                    <CardTitle className="text-sm font-semibold text-[#172033]">Business Profile</CardTitle>
                    <CardDescription className="text-xs text-[#5F6B7A]">
                        This information is referenced by your AI assistant when responding to customer queries.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="space-y-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-semibold text-[#172033] flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-[#2F8F83]" />
                                                Company Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field} 
                                                    data-testid="input-company-name" 
                                                    placeholder="e.g. Connectly360" 
                                                    className="h-10 text-xs sm:text-sm rounded-lg border border-[#E5E9EE] focus-visible:ring-1 focus-visible:ring-[#2F8F83] focus-visible:border-[#2F8F83]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contactNumber"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-semibold text-[#172033] flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-[#2F8F83]" />
                                                Contact Number
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field} 
                                                    data-testid="input-contact-number" 
                                                    placeholder="+91 9586557162" 
                                                    className="h-10 text-xs sm:text-sm rounded-lg border border-[#E5E9EE] focus-visible:ring-1 focus-visible:ring-[#2F8F83] focus-visible:border-[#2F8F83]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="deliveryInformation"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-semibold text-[#172033] flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-[#2F8F83]" />
                                                Delivery Information
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    data-testid="textarea-delivery-info"
                                                    placeholder="We deliver across India..."
                                                    rows={4}
                                                    className="text-xs sm:text-sm rounded-lg border border-[#E5E9EE] focus-visible:ring-1 focus-visible:ring-[#2F8F83] focus-visible:border-[#2F8F83] resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="businessHours"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-semibold text-[#172033] flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-[#2F8F83]" />
                                                Business Hours
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field} 
                                                    data-testid="input-business-hours" 
                                                    placeholder="Mon-Sat: 9:00 AM - 7:00 PM IST" 
                                                    className="h-10 text-xs sm:text-sm rounded-lg border border-[#E5E9EE] focus-visible:ring-1 focus-visible:ring-[#2F8F83] focus-visible:border-[#2F8F83]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="h-10 px-6 text-xs font-semibold bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                                        disabled={updateSettings.isPending}
                                        data-testid="button-save-settings"
                                    >
                                        {updateSettings.isPending ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </span>
                                        ) : (
                                            "Save Settings"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
