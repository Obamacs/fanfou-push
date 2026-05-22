import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://lwercdnrvxrsnjjvojfx.supabase.co";

/**
 * Proxies Supabase API requests through the app's own domain so they work from
 * China (supabase.co is blocked there). Replaces the standalone Cloudflare
 * Worker that was used when the site was hosted on Cloudflare.
 */
async function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/supabase/, "") + url.search;
  const target = SUPABASE_URL + path;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() === "host") return;
    headers.set(key, value);
  });

  // Vercel's outbound IPs are sometimes treated as untrusted by Supabase, even
  // for public storage objects. Always inject the anon key so requests are
  // authenticated at the anon level.
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (anonKey) {
    headers.set("apikey", anonKey);
    headers.set("Authorization", `Bearer ${anonKey}`);
  }

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  try {
    const resp = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    const respHeaders = new Headers(resp.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");
    respHeaders.set("Access-Control-Expose-Headers", "Content-Length, X-JSON-response-length");

    return new NextResponse(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    console.error("Supabase proxy error:", err);
    return NextResponse.json(
      { error: "代理请求失败" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function POST(req: NextRequest) {
  return proxy(req);
}

export async function PUT(req: NextRequest) {
  return proxy(req);
}

export async function DELETE(req: NextRequest) {
  return proxy(req);
}

export async function PATCH(req: NextRequest) {
  return proxy(req);
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      "Access-Control-Max-Age": "86400",
    },
  });
}
