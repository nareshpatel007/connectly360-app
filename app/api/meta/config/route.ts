import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    appId: process.env.META_APP_ID || null,
    configId: process.env.META_CONFIG_ID || null,
    verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || "connectly360_verify_token_secure_9ae7b3",
  });
}
