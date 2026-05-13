import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================
// 两个完整的测试角色，模拟真实注册后状态
// 注册后 → 未 onboarding → 有待用优惠券 → 有邀请码
// 登录后强制走完整 onboarding 流程
// ============================================================

interface Persona {
  email: string;
  password: string;
  name: string;
}

const personas: Persona[] = [
  { email: "test1@meal-meet.com", password: "Test123!", name: "王小帅" },
  { email: "test2@meal-meet.com", password: "Test123!", name: "李诗意" },
];

function genCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const r = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `COUP-${r()}-${r()}`;
}

function genInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function resetPersona(persona: Persona) {
  console.log(`\n--- ${persona.name} (${persona.email}) ---`);

  const hashedPassword = await bcrypt.hash(persona.password, 10);

  // 1. 删除旧用户（如果有），完全重建
  const existing = await prisma.user.findUnique({ where: { email: persona.email } });
  if (existing) {
    // 级联删除关联数据
    await prisma.userInterest.deleteMany({ where: { userId: existing.id } });
    await prisma.questionnaireAnswer.deleteMany({ where: { userId: existing.id } });
    await prisma.freeCoupon.deleteMany({ where: { userId: existing.id } });
    await prisma.inviteCode.deleteMany({ where: { ownerId: existing.id } });
    await prisma.inviteCodeUsage.deleteMany({ where: { newUserId: existing.id } });
    await prisma.eventAttendance.deleteMany({ where: { userId: existing.id } });
    await prisma.message.deleteMany({ where: { userId: existing.id } });
    await prisma.directMessage.deleteMany({ where: { OR: [{ senderId: existing.id }, { receiverId: existing.id }] } });
    await prisma.matchMember.deleteMany({ where: { userId: existing.id } });
    await prisma.rating.deleteMany({ where: { OR: [{ raterId: existing.id }, { ratedUserId: existing.id }] } });
    await prisma.report.deleteMany({ where: { OR: [{ reportedById: existing.id }, { reportedUserId: existing.id }] } });
    await prisma.block.deleteMany({ where: { OR: [{ blockerId: existing.id }, { blockedId: existing.id }] } });
    await prisma.account.deleteMany({ where: { userId: existing.id } });
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
    console.log("  ↻ 已清除旧账户");
  }

  // 2. 创建用户（注册后的原始状态：仅 email+name+password，未 onboarded）
  const user = await prisma.user.create({
    data: {
      email: persona.email,
      name: persona.name,
      passwordHash: hashedPassword,
      isOnboarded: false,       // ← 强制走 onboarding 流程
      isActive: true,
      isBanned: false,
      role: "USER",
      canCreateEvents: true,    // 允许创建活动
    },
  });
  console.log("  ✓ 账户已创建（isOnboarded=false）");

  // 3. 创建邀请码（注册后自动生成）
  const inviteCode = await prisma.inviteCode.create({
    data: { code: genInviteCode(), ownerId: user.id },
  });
  console.log(`  ✓ 邀请码: ${inviteCode.code}`);

  // 4. 发放注册券（模拟注册时通过邀请码获得的券）
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const coupon1 = await prisma.freeCoupon.create({
    data: {
      code: genCouponCode(),
      userId: user.id,
      welcomeText: `${persona.name}，欢迎加入饭否！凭此券可免费参加一次付费活动。`,
      expiresAt,
      reason: "REGISTER",
    },
  });
  console.log(`  ✓ 注册券: ${coupon1.code}`);

  const coupon2 = await prisma.freeCoupon.create({
    data: {
      code: genCouponCode(),
      userId: user.id,
      welcomeText: `感谢你邀请朋友，这张券送给你！`,
      expiresAt,
      reason: "INVITED_SOMEONE",
    },
  });
  console.log(`  ✓ 邀请券: ${coupon2.code}`);

  return { user, inviteCode: inviteCode.code, coupons: [coupon1.code, coupon2.code] };
}

async function main() {
  console.log("🎭 构建测试账户（不跳过 onboarding）\n");
  console.log("=".repeat(50));

  const results = [];
  for (const p of personas) {
    results.push(await resetPersona(p));
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ 测试账户已就绪\n");

  for (let i = 0; i < personas.length; i++) {
    const p = personas[i];
    const r = results[i];
    console.log(`🎭 ${p.name}`);
    console.log(`   邮箱:   ${p.email}`);
    console.log(`   密码:   ${p.password}`);
    console.log(`   邀请码: ${r.inviteCode}`);
    console.log(`   券码:   ${r.coupons[0]} | ${r.coupons[1]}`);
    console.log();
  }

  console.log("📋 完整测试流程：");
  console.log("   1️⃣  注册 → /register（或直接用上述账户登录 /login 管理员登录模式）");
  console.log("   2️⃣  登录 → 强制跳转 /onboarding 引导流程（8 步）");
  console.log("   3️⃣  引导完成 → /dashboard 仪表板");
  console.log("   4️⃣  浏览活动 → /events");
  console.log("   5️⃣  创建活动 → /events/new");
  console.log("   6️⃣  报名活动 → /events/[id]（付费活动使用券码）");
  console.log("   7️⃣  匹配 → /match");
  console.log("   8️⃣  私信 → /messages");
  console.log("   9️⃣  活动结束后评分");
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
