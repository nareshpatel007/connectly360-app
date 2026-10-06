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
        <div className="space-y-6">
            <PageHeader
                icon={Building2}
                title="Business Settings"
                description="Configure your business profile, operating hours, and customer auto-reply information."
                breadcrumbs={[{ label: "Settings" }]}
            />

            <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900">Business Profile</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                        This information is referenced by your AI assistant when responding to customer queries.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    {isLoading ? (
                        <div className="space-y-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-blue-500" />
                                                Company Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field} 
                                                    data-testid="input-company-name" 
                                                    placeholder="e.g. Connectly360" 
                                                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-blue-500/50"
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
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-green-500" />
                                                Contact Number
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field} 
                                                    data-testid="input-contact-number" 
                                                    placeholder="+91 9586557162" 
                                                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-green-500/50"
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
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-orange-500" />
                                                Delivery Information
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    data-testid="textarea-delivery-info"
                                                    placeholder="We deliver across India..."
                                                    rows={4}
                                                    className="text-base border-2 focus-visible:ring-2 focus-visible:ring-orange-500/50 resize-none"
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
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-purple-500" />
                                                Business Hours
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field} 
                                                    data-testid="input-business-hours" 
                                                    placeholder="Mon-Sat: 9:00 AM - 7:00 PM IST" 
                                                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500/50"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full h-11 text-sm font-bold bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
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
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
