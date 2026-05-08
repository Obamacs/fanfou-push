import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";

const SETTINGS_KEYS = [
  "minUsersForMatch",
  "maxMatchGroupSize",
  "matchExpirationHours",
  "eventCreationBanDuration",
] as const;

type SettingsKey = (typeof SETTINGS_KEYS)[number];
type Settings = Record<SettingsKey, number>;

const DEFAULT_SETTINGS: Settings = {
  minUsersForMatch: 3,
  maxMatchGroupSize: 6,
  matchExpirationHours: 24,
  eventCreationBanDuration: 30,
};

const RANGES: Record<SettingsKey, { min: number; max: number }> = {
  minUsersForMatch: { min: 2, max: 20 },
  maxMatchGroupSize: { min: 3, max: 20 },
  matchExpirationHours: { min: 1, max: 168 },
  eventCreationBanDuration: { min: 1, max: 365 },
};

let runtimeSettings: Settings = { ...DEFAULT_SETTINGS };

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json({ settings: runtimeSettings });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const next: Partial<Settings> = {};

    for (const key of SETTINGS_KEYS) {
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

    runtimeSettings = { ...runtimeSettings, ...next };
    return NextResponse.json({ settings: runtimeSettings });
  } catch {
    return NextResponse.json({ error: "设置保存失败" }, { status: 500 });
  }
}
