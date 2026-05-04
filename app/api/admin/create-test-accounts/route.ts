import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const testAccounts = [
      {
        email: "test@fanfou.com",
        name: "测试用户",
        password: "Test123456",
        role: "USER",
      },
      {
        email: "demo@fanfou.com",
        name: "演示用户",
        password: "Demo123456",
        role: "USER",
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

      const user = await db.user.create({
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
