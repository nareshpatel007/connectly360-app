import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

async function buildEndpoint(
    req: NextRequest,
    params: Promise<{ path: string[] }>
): Promise<string> {
    const resolvedParams = await params;
    const endpoint = `/${resolvedParams.path.join("/")}`;
    const searchParams = req.nextUrl.searchParams.toString();
    return searchParams ? `${endpoint}?${searchParams}` : endpoint;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const fullEndpoint = await buildEndpoint(req, params);
    return handleApiProxy(req, fullEndpoint, "GET");
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const fullEndpoint = await buildEndpoint(req, params);
    return handleApiProxy(req, fullEndpoint, "POST");
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const fullEndpoint = await buildEndpoint(req, params);
    return handleApiProxy(req, fullEndpoint, "PUT");
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const fullEndpoint = await buildEndpoint(req, params);
    return handleApiProxy(req, fullEndpoint, "PATCH");
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const fullEndpoint = await buildEndpoint(req, params);
    return handleApiProxy(req, fullEndpoint, "DELETE");
}
