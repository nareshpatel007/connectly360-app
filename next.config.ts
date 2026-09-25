import type { NextConfig } from "next";

const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
    env: {
        API_URL: process.env.API_URL || "http://localhost/connectly360/connectly360-backend/public/api",
    },
    async redirects() {
        return [
            {
                source: "/pricing",
                destination: `${websiteUrl}/pricing`,
                permanent: false,
            },
            {
                source: "/contact",
                destination: `${websiteUrl}/contact`,
                permanent: false,
            },
            {
                source: "/book-demo",
                destination: `${websiteUrl}/book-demo`,
                permanent: false,
            },
            {
                source: "/blog",
                destination: `${websiteUrl}/blog`,
                permanent: false,
            },
            {
                source: "/blog/:slug*",
                destination: `${websiteUrl}/blog/:slug*`,
                permanent: false,
            },
            {
                source: "/faq",
                destination: `${websiteUrl}/faq`,
                permanent: false,
            },
            {
                source: "/privacy",
                destination: `${websiteUrl}/privacy`,
                permanent: false,
            },
            {
                source: "/terms",
                destination: `${websiteUrl}/terms`,
                permanent: false,
            },
            {
                source: "/cookie-policy",
                destination: `${websiteUrl}/cookie-policy`,
                permanent: false,
            },
            {
                source: "/refund-policy",
                destination: `${websiteUrl}/refund-policy`,
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
