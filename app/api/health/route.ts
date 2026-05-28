import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  const healthData: Record<string, any> = {
    status: "healthy",
    timestamp,
    env: process.env.NODE_ENV,
    services: {
      database: "unknown",
      stripe: "unconfigured",
      resend: "unconfigured",
      anthropic: "unconfigured",
    },
  };

  // 1. Verify Database connectivity
  try {
    // Quick, light probe check on the database connection
    await db.$queryRaw`SELECT 1`;
    healthData.services.database = "connected";
  } catch (error: any) {
    console.error("Health probe database error:", error);
    healthData.status = "unhealthy";
    healthData.services.database = `disconnected: ${error.message || error}`;
  }

  // 2. Check external service config status (presence only, secure)
  if (process.env.STRIPE_SECRET_KEY) {
    healthData.services.stripe = "configured";
  }
  if (process.env.RESEND_API_KEY) {
    healthData.services.resend = "configured";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    healthData.services.anthropic = "configured";
  }

  const httpStatus = healthData.status === "healthy" ? 200 : 503;
  return NextResponse.json(healthData, { status: httpStatus });
}
