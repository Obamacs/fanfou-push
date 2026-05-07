import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ensureInviteCode } from "@/lib/coupon";
import { customAlphabet } from "nanoid";

const supabaseUrl = process.env.SUPABASE_URL || "https://lwercdnrvxrsnjjvojfx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateCouponCode(): string {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);
  return `COUP-${nanoid()}-${nanoid()}`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, inviteCode } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "名字和邮箱为必填项" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // Validate invite code if provided
    let inviteCodeRecord = null;
    let inviteCodeValid = false;

    if (inviteCode) {
      const trimmedCode = (inviteCode as string).toUpperCase().trim();
      inviteCodeRecord = await db.inviteCode.findUnique({
        where: { code: trimmedCode },
      });

      if (inviteCodeRecord && inviteCodeRecord.isActive) {
        inviteCodeValid = true;
      }
    }

    // Generate welcome texts outside of transaction (network IO)
    let newUserWelcomeText = "";
    let inviterWelcomeText = "";

    if (inviteCodeValid && inviteCodeRecord) {
      try {
        const { generateCouponWelcomeText } = await import("@/lib/claude");
        newUserWelcomeText = await generateCouponWelcomeText(name);
        const inviter = await db.user.findUnique({
          where: { id: inviteCodeRecord.ownerId },
        });
        if (inviter) {
          inviterWelcomeText = await generateCouponWelcomeText(inviter.name);
        }
      } catch (err) {
        console.error("Failed to generate welcome texts:", err);
      }
    }

    // Transaction: create user, usage record, coupons, and invite code
    let couponIssued = false;

    await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          role: "USER",
        },
      });

      if (inviteCodeValid && inviteCodeRecord) {
        try {
          // Record usage
          await tx.inviteCodeUsage.create({
            data: {
              inviteCodeId: inviteCodeRecord.id,
              newUserId: newUser.id,
            },
          });

          // Update usage count
          await tx.inviteCode.update({
            where: { id: inviteCodeRecord.id },
            data: { usageCount: { increment: 1 } },
          });

          // Issue coupon to new user
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 90);

          await tx.freeCoupon.create({
            data: {
              code: generateCouponCode(),
              userId: newUser.id,
              welcomeText: newUserWelcomeText || `${name}，欢迎加入饭否！这张券是送给你的第一份礼物，用它免费参加一次心仪的活动吧。`,
              expiresAt,
              reason: "REGISTER",
            },
          });

          // Issue coupon to inviter
          await tx.freeCoupon.create({
            data: {
              code: generateCouponCode(),
              userId: inviteCodeRecord.ownerId,
              welcomeText: inviterWelcomeText || `你邀请的朋友${name}已加入饭否！这张券是我们的感谢，期待你们在饭否聚会中相遇。`,
              expiresAt,
              reason: "INVITED_SOMEONE",
            },
          });

          couponIssued = true;
        } catch (err) {
          console.error("Failed to process invite code:", err);
        }
      }

      // Create invite code for new user
      try {
        const newUserCode = await ensureInviteCode(newUser.id);
        console.log("Generated invite code for new user:", newUserCode);
      } catch (err) {
        console.error("Failed to generate invite code for new user:", err);
      }
    });

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://meal-meet.com/api/auth/callback",
      },
    });

    if (error) {
      console.error("Supabase magic link error:", error);
      return NextResponse.json(
        { error: `发送邮件失败: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "注册成功！验证链接已发送到你的邮箱",
      couponIssued,
      inviteCodeValid,
      email,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: `注册失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
