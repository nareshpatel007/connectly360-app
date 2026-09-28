import { NextResponse } from "next/server";

function getApiUrl(): string {
  const envUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes(":8000")) {
    return envUrl.replace("http://localhost", "http://127.0.0.1");
  }
  return "http://127.0.0.1/connectly360/connectly360-backend/public/api";
}

export async function GET() {
  let appId = process.env.META_APP_ID || null;
  let configId = process.env.META_CONFIG_ID || null;
  let verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || null;

  if (!appId || !configId) {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/meta/config`, {
        headers: {
          "X-Api-Token": process.env.API_TOKEN || "1sa2a5gfd1f2g12asd4asd1a2sf5sdf",
        },
        cache: "no-store",
      });
      if (res.ok) {
        const backendData = await res.json();
        if (backendData) {
          appId = appId || backendData.appId || backendData.app_id || null;
          configId = configId || backendData.configId || backendData.config_id || null;
          verifyToken = verifyToken || backendData.verifyToken || backendData.verify_token || null;
        }
      }
    } catch (err) {
      console.error("[meta/config] Failed to load config from backend:", err);
    }
  }

  return NextResponse.json({
    appId: appId || "2003300290580728",
    configId: configId || "4415243742081393",
    verifyToken: verifyToken || "connectly360_verify_token_secure_9ae7b3",
  });
}
