import { NextRequest, NextResponse } from "next/server";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const API_TOKEN = process.env.API_TOKEN || "1sa2a5gfd1f2g12asd4asd1a2sf5sdf";

function getApiUrl(): string {
    const envUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes(":8000")) {
        return envUrl.replace("http://localhost", "http://127.0.0.1");
    }
    return "http://127.0.0.1/connectly360/connectly360-backend/public/api";
}

export async function handleApiProxy(
    req: NextRequest,
    endpoint: string,
    method: string = "POST"
) {
    try {
        // Validate origin
        const origin = req.headers.get("origin");
        const referer = req.headers.get("referer");

        const allowedOrigins = [
            SITE_URL,
            process.env.NEXT_PUBLIC_APP_URL
        ].filter((url): url is string => Boolean(url));

        const isValidOrigin =
            !origin && !referer
                ? true
                : process.env.NODE_ENV === "development" ||
                allowedOrigins.some(allowed => origin === allowed || (referer && referer.startsWith(allowed)));

        if (!isValidOrigin) {
            return NextResponse.json(
                { success: false, message: "Unauthorized origin" },
                { status: 403 }
            );
        }

        const clientAuth = req.headers.get("Authorization");
        const clientCookie = req.headers.get("cookie");

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Requested-Domain": SITE_URL,
            "X-Api-Token": API_TOKEN,
            "Authorization": clientAuth || `Bearer ${API_TOKEN}`
        };

        if (clientCookie) {
            headers["Cookie"] = clientCookie;
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        // Don't pass a body for GET or HEAD requests
        if (method !== "GET" && method !== "HEAD") {
            const body = await req.json().catch(() => null);
            if (body) {
                fetchOptions.body = JSON.stringify(body);
            }
        }

        const rawApiUrl = getApiUrl();
        const baseUrl = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;
        const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        const targetUrl = `${baseUrl}${normalizedEndpoint}`;

        // Call backend API
        const apiRes = await fetch(targetUrl, fetchOptions);

        const text = await apiRes.text();

        const responseHeaders = new Headers();
        responseHeaders.set("Content-Type", apiRes.headers.get("content-type") || "application/json");

        // Forward Set-Cookie headers from backend to client browser
        if (typeof apiRes.headers.getSetCookie === "function") {
            const cookies = apiRes.headers.getSetCookie();
            cookies.forEach(c => responseHeaders.append("Set-Cookie", c));
        } else {
            const setCookie = apiRes.headers.get("set-cookie");
            if (setCookie) {
                responseHeaders.set("Set-Cookie", setCookie);
            }
        }

        return new NextResponse(text, {
            status: apiRes.status,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error("[connectly360-app apiProxy error]:", error);
        return NextResponse.json(
            {
                success: false,
                message: process.env.NODE_ENV === "development" ? (error?.message || "Internal Server Error") : "Internal Server Error"
            },
            { status: 500 }
        );
    }
}