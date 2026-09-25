import type { Metadata } from "next";
import { Inter, Jost, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AuthProvider } from "@/lib/auth-context";
import { SupportChatWidget } from "@/components/support-chat";

const jost = Jost({
    variable: "--font-jost",
    subsets: ["latin"],
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
});

export const viewport = {
    themeColor: "#0B2E1E",
};

export const metadata: Metadata = {
    metadataBase: new URL("https://connectly360.com"),
    title: {
        default: "Connectly360 | Connect. Automate. Grow.",
        template: "%s | Connectly360",
    },
    description: "Connect WhatsApp, automate replies, capture leads, and grow your business with AI-powered customer engagement.",
    keywords: ["WhatsApp Business", "WhatsApp Automation", "Meta Embedded Signup", "AI Customer Engagement", "Lead Pipeline", "CRM Automation"],
    icons: {
        icon: "/images/favicon.png",
        shortcut: "/favicon.ico",
        apple: "/images/icon.png",
    },
    openGraph: {
        title: "Connectly360 - Manage Customer Conversations, Leads, and AI Automation in One Platform",
        description: "Connect WhatsApp, automate replies, capture leads, and grow your business with AI-powered customer engagement.",
        url: "https://connectly360.com",
        siteName: "Connectly360",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Connectly360 - Manage Customer Conversations, Leads, and AI Automation in One Platform",
        description: "Connect WhatsApp, automate replies, capture leads, and grow your business with AI-powered customer engagement.",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${jost.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <body className="min-h-full bg-background text-foreground flex flex-col font-sans">
                <Providers>
                    <AuthProvider>
                        {children}
                        <SupportChatWidget />
                    </AuthProvider>
                </Providers>
            </body>
        </html>
    );
}
