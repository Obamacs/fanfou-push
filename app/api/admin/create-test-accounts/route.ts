import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { randomBytes } from "crypto";

function generatePassword(): string {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

export async function POST() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const testAccounts = [
      {
        email: process.env.SEED_ADMIN_EMAIL || "admin@meal-meet.com",
        name: "Admin",
        password: process.env.SEED_ADMIN_PASSWORD || generatePassword(),
        role: "ADMIN" as const,
      },
      {
        email: process.env.SEED_TEST_EMAIL || "test@meal-meet.com",
        name: "Test User",
        password: process.env.SEED_TEST_PASSWORD || generatePassword(),
        role: "USER" as const,
      },
      {
        email: process.env.SEED_DEMO_EMAIL || "demo@meal-meet.com",
        name: "Demo User",
        password: process.env.SEED_DEMO_PASSWORD || generatePassword(),
        role: "USER" as const,
      },
    ];

    const results = [];

    for (const account of testAccounts) {
      const existingUser = await db.user.findUnique({
        where: { email: account.email },
      });

      if (existingUser) {
        results.push({
          email: account.email,
          status: "已存在",
        });
        continue;
      }

      const hashedPassword = await bcrypt.hash(account.password, 10);

      await db.user.create({
        data: {
          email: account.email,
          name: account.name,
          passwordHash: hashedPassword,
          role: account.role,
          isActive: true,
          isBanned: false,
          canCreateEvents: account.role === "ADMIN",
        },
      });

      results.push({
        email: account.email,
        name: account.name,
        password: account.password,
        status: "✅ 创建成功",
      });
    }

    return NextResponse.json(
      {
        message: "✅ 测试账户初始化完成",
        accounts: results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create test accounts error:", error);
    return NextResponse.json(
      { error: "创建失败，请重试" },
      { status: 500 }
    );
  }
}
