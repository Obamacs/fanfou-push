import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const base = process.env.NEXTAUTH_URL || "https://meal-meet.com";
  return NextResponse.redirect(
    new URL(`/register?invite=${encodeURIComponent(code)}`, base)
  );
}
