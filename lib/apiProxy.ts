import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.SITE_URL || "http://localhost:3000";
const API_TOKEN = process.env.API_TOKEN || "";

export async function handleApiProxy(
    req: NextRequest,
    endpoint: string,
    method: string = "POST"
) {
    try {
        // Validate origin
        const origin = req.headers.get("origin");
        const referer = req.headers.get("referer");

        const isValidOrigin =
            !origin && !referer
                ? true
                : (origin && (origin === ALLOWED_ORIGIN || origin.startsWith(ALLOWED_ORIGIN))) ||
                  (referer && referer.startsWith(ALLOWED_ORIGIN));

        if (!isValidOrigin) {
            return NextResponse.json(
                { success: false, message: "Unauthorized origin" },
                { status: 403 }
            );
        }

        const clientAuth = req.headers.get("Authorization");

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Requested-Domain": ALLOWED_ORIGIN,
            "X-Api-Token": API_TOKEN,
            "Authorization": clientAuth || `Bearer ${API_TOKEN}`
        };

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

        const rawApiUrl = process.env.API_URL || "http://localhost/connectly360/connectly360-backend/public/api";
        const baseUrl = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;
        const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        const targetUrl = `${baseUrl}${normalizedEndpoint}`;

        // Call backend API
        const apiRes = await fetch(targetUrl, fetchOptions);

        const text = await apiRes.text();

        return new NextResponse(text, {
            status: apiRes.status,
            headers: {
                "Content-Type":
                    apiRes.headers.get("content-type") || "application/json",
            },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}