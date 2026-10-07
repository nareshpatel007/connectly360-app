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
        const incomingContentType = req.headers.get("content-type") || "";
        const tenantHeader = req.headers.get("X-Tenant-Id") || req.headers.get("x-tenant-id");

        const hasValidAuth = Boolean(
            clientAuth &&
            !clientAuth.includes("undefined") &&
            !clientAuth.includes("null") &&
            clientAuth.replace("Bearer", "").trim().length > 10
        );

        const headers: Record<string, string> = {
            "Requested-Domain": SITE_URL,
            "X-Api-Token": API_TOKEN,
            "Authorization": hasValidAuth && clientAuth ? clientAuth : `Bearer ${API_TOKEN}`
        };

        if (tenantHeader) {
            headers["X-Tenant-Id"] = tenantHeader;
        }

        if (clientCookie) {
            headers["Cookie"] = clientCookie;
        }

        let bodyPayload: any = undefined;

        // Handle body for non-GET/HEAD requests
        if (method !== "GET" && method !== "HEAD") {
            if (incomingContentType.includes("multipart/form-data")) {
                headers["Content-Type"] = incomingContentType;
                const arrayBuf = await req.arrayBuffer();
                bodyPayload = Buffer.from(arrayBuf);
            } else {
                headers["Content-Type"] = "application/json";
                const jsonBody = await req.json().catch(() => null);
                if (jsonBody) {
                    bodyPayload = JSON.stringify(jsonBody);
                }
            }
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
            body: bodyPayload,
        };

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