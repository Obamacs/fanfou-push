import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSecondUser() {
  try {
    console.log('📝 创建第二个测试用户...\n');
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'test2@example.com',
        name: '测试用户2',
        passwordHash: hashedPassword,
        isOnboarded: true,
        isActive: true,
        city: '北京',
        ageGroup: '26-35',
        gender: 'FEMALE',
      },
    });

    const interests = await prisma.interest.findMany({ take: 3 });
    if (interests.length > 0) {
      await prisma.userInterest.createMany({
        data: interests.map(interest => ({
          userId: user.id,
          interestId: interest.id,
        })),
      });
    }

    console.log('✅ 第二个用户创建成功！\n');
    console.log('邮箱: test2@example.com');
    console.log('密码: 123456');
    console.log('用户ID: ' + user.id);
  } catch (error) {
    console.error('创建失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSecondUser();
