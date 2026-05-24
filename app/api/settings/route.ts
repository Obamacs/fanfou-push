import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SETTINGS_KEY = "runtime_settings";

export async function GET() {
  try {
    const row = await db.appSettings.findUnique({
      where: { key: SETTINGS_KEY },
    });
    if (row) {
      const parsed = JSON.parse(row.value);
      return NextResponse.json({
        wechatQRCodeUrl: parsed.wechatQRCodeUrl || "",
        alipayQRCodeUrl: parsed.alipayQRCodeUrl || "",
      });
    }
  } catch (error) {
    console.error("Failed to fetch public settings:", error);
  }

  return NextResponse.json({
    wechatQRCodeUrl: "",
    alipayQRCodeUrl: "",
  });
}
