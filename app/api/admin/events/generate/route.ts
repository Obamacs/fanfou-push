import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const OPERATING_CITIES = ["Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu", "Hangzhou"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // Calculate next Thursday 20:00
    const now = new Date();
    const nextThursday = new Date();
    // getDay() -> 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    let daysUntilThursday = (4 - now.getDay() + 7) % 7;
    if (daysUntilThursday === 0 && now.getHours() >= 20) {
      daysUntilThursday = 7; // If it's already past Thursday 8PM, get next week
    }
    
    nextThursday.setDate(now.getDate() + daysUntilThursday);
    nextThursday.setHours(20, 0, 0, 0);

    const generatedEvents = [];

    // Check and create pool events for each city
    for (const city of OPERATING_CITIES) {
      const existingPool = await db.event.findFirst({
        where: {
          type: "POOL",
          city,
          date: nextThursday,
        }
      });

      if (!existingPool) {
        const newPool = await db.event.create({
          data: {
            title: `${city} 周四盲盒晚餐等候池`,
            type: "POOL",
            city,
            date: nextThursday,
            maxAttendees: 10000, // virtually unlimited for the pool
            priceAmount: 99, // default price for booking
            status: "UPCOMING",
            creatorId: session.user.id, // Admin
            description: "报名加入本周四的盲盒晚餐。周三晚我们将为你精准匹配 5 位陌生人，并在周四揭晓神秘餐厅！",
          }
        });
        generatedEvents.push(newPool);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `成功生成了 ${generatedEvents.length} 个城市的等候池`,
      date: nextThursday 
    });
  } catch (error) {
    console.error("Generate pool events error:", error);
    return NextResponse.json(
      { error: "生成失败" },
      { status: 500 }
    );
  }
}
