import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db";

const SETTINGS_KEY = "runtime_settings";

type Settings = {
  minUsersForMatch: number;
  maxMatchGroupSize: number;
  matchExpirationHours: number;
  eventCreationBanDuration: number;
};

const DEFAULT_SETTINGS: Settings = {
  minUsersForMatch: 3,
  maxMatchGroupSize: 6,
  matchExpirationHours: 24,
  eventCreationBanDuration: 30,
};

const RANGES: Record<keyof Settings, { min: number; max: number }> = {
  minUsersForMatch: { min: 2, max: 20 },
  maxMatchGroupSize: { min: 3, max: 20 },
  matchExpirationHours: { min: 1, max: 168 },
  eventCreationBanDuration: { min: 1, max: 365 },
};

async function getSettings(): Promise<Settings> {
  try {
    const row = await db.appSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });
    if (row) return JSON.parse(row.value) as Settings;
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const settings = await getSettings();
    const next: Partial<Settings> = {};

    for (const key of Object.keys(RANGES) as (keyof Settings)[]) {
      const raw = body[key];
      if (raw === undefined) continue;
      const value = Number(raw);
      const range = RANGES[key];
      if (!Number.isFinite(value) || value < range.min || value > range.max) {
        return NextResponse.json(
          { error: `${key} 必须在 ${range.min} 到 ${range.max} 之间` },
          { status: 400 }
        );
      }
      next[key] = value;
    }

    Object.assign(settings, next);

    await db.appSettings.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: JSON.stringify(settings) },
      update: { value: JSON.stringify(settings) },
    });

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "设置保存失败" }, { status: 500 });
  }
}
