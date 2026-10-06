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
  let graphApiVersion = process.env.META_GRAPH_API_VERSION || null;
  let redirectUri = process.env.META_REDIRECT_URI || null;
  let verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || null;
  let debug = process.env.META_WHATSAPP_DEBUG === "true";

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
        graphApiVersion = graphApiVersion || backendData.graphApiVersion || backendData.graph_api_version || null;
        redirectUri = redirectUri || backendData.redirectUri || backendData.redirect_uri || null;
        verifyToken = verifyToken || backendData.verifyToken || backendData.verify_token || null;
        if (typeof backendData.debug === "boolean") {
          debug = debug || backendData.debug;
        }
      }
    }
  } catch (err) {
    console.error("[meta/config] Failed to load config from backend:", err);
  }

  return NextResponse.json({
    appId: appId || "2003300290580728",
    configId: configId || "4415243742081393",
    graphApiVersion: graphApiVersion || "v22.0",
    redirectUri: redirectUri || "https://app.connectly360.com/integrations/whatsapp",
    verifyToken: verifyToken || "connectly360_verify_token_secure_9ae7b3",
    debug: debug,
  });
}
