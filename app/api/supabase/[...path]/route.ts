import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://lwercdnrvxrsnjjvojfx.supabase.co";

// Headers that are safe to forward to Supabase. Cloudflare/Vercel-specific
// headers (cf-*, x-forwarded-*, etc.) can cause Supabase to require
// authentication even for public storage objects.
const SAFE_HEADERS = new Set([
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "content-length",
  "content-type",
  "origin",
  "pragma",
  "range",
  "referer",
  "user-agent",
]);

async function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/supabase/, "") + url.search;

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_ouuTeuoTh05cseDyjEhqkw_Yu6v40Ej";

  // Inject anon key as URL parameter — Vercel's runtime may strip custom
  // headers from outbound fetch calls.
  const sep = path.includes("?") ? "&" : "?";
  const target = `${SUPABASE_URL}${path}${sep}apikey=${encodeURIComponent(anonKey)}`;

  const headers = new Headers();

  // Only forward safe headers — Vercel/Cloudflare headers trigger auth
  req.headers.forEach((value, key) => {
    if (SAFE_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

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
    // Debug: prove this version is running
    respHeaders.set("X-Proxy-Version", "url-apikey-v4");
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");
    respHeaders.set("Access-Control-Expose-Headers", "Content-Length, X-JSON-response-length");
    // Strip Supabase's Cloudflare cookies to avoid leaking to our domain
    respHeaders.delete("set-cookie");

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

export async function OPTIONS(_req: NextRequest) {
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
