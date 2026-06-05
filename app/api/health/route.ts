import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EMAIL_FROM } from "@/lib/email";

export const dynamic = "force-dynamic";

type HealthData = {
  status: "healthy" | "unhealthy";
  timestamp: string;
  env: string | undefined;
  services: {
    database: string;
    stripe: string;
    resend: string;
    emailFromDomain: string;
    anthropic: string;
  };
};

export async function GET() {
  const timestamp = new Date().toISOString();
  const healthData: HealthData = {
    status: "healthy",
    timestamp,
    env: process.env.NODE_ENV,
    services: {
      database: "unknown",
      stripe: "unconfigured",
      resend: "unconfigured",
      emailFromDomain: "unknown",
      anthropic: "unconfigured",
    },
  };

  // 1. Verify Database connectivity
  try {
    // Quick, light probe check on the database connection
    await db.$queryRaw`SELECT 1`;
    healthData.services.database = "connected";
  } catch (error: unknown) {
    console.error("Health probe database error:", error);
    healthData.status = "unhealthy";
    const message = error instanceof Error ? error.message : String(error);
    healthData.services.database = `disconnected: ${message}`;
  }

  // 2. Check external service config status (presence only, secure)
  if (process.env.STRIPE_SECRET_KEY) {
    healthData.services.stripe = "configured";
  }
  if (process.env.RESEND_API_KEY) {
    healthData.services.resend = "configured";
  }
  const emailFromMatch = EMAIL_FROM.match(/@([^>\s]+)>?$/);
  if (emailFromMatch) {
    healthData.services.emailFromDomain = emailFromMatch[1];
  }
  if (process.env.ANTHROPIC_API_KEY) {
    healthData.services.anthropic = "configured";
  }

  const httpStatus = healthData.status === "healthy" ? 200 : 503;
  return NextResponse.json(healthData, { status: httpStatus });
}
