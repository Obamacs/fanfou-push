import { db } from "@/lib/db";
import { selectBalancedGroup, calculateActivityScore } from "@/lib/matching";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { sendAlert } from "@/lib/alert";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const adminUserId = auth.userId;

    const { poolEventId } = await req.json();

    if (!poolEventId) {
      return NextResponse.json({ error: "缺少 Pool Event ID" }, { status: 400 });
    }

    // 1. Fetch the Pool Event and its attendees
    const poolEvent = await db.event.findUnique({
      where: { id: poolEventId, type: "POOL" },
      include: {
        attendances: {
          where: { status: "CONFIRMED" },
          include: {
            user: {
              include: {
                interests: { include: { interest: true } },
                answers: true,
              },
            },
          },
        },
      },
    });

    if (!poolEvent) {
      return NextResponse.json({ error: "找不到有效的等候池活动" }, { status: 404 });
    }

    const attendees = poolEvent.attendances;
    if (attendees.length === 0) {
      return NextResponse.json({ error: "等候池中没有确认的报名者" }, { status: 400 });
    }

    // 2. Prepare the pool for the algorithm
    // We map attendees to the Candidate interface required by selectBalancedGroup
    let pool = attendees.map(a => ({
      id: a.user.id,
      ageGroup: a.user.ageGroup,
      gender: a.user.gender,
      relationshipGoal: a.user.relationshipGoal,
      smokingHabit: a.user.smokingHabit,
      drinkingHabit: a.user.drinkingHabit,
      wantsChildren: a.user.wantsChildren,
      interests: a.user.interests,
      answers: a.user.answers,
      score: 50, // Default score, normally calculated against a seed
      originalUser: a.user,
    }));

    const tables: Array<Array<{ id: string }>> = [];
    const TABLE_SIZE = 6;
    const MIN_TABLE_SIZE = 4;

    // 3. Chunking logic
    while (pool.length > 0) {
      if (pool.length < MIN_TABLE_SIZE && tables.length > 0) {
        // Not enough for a new table, distribute remaining users to existing tables if possible
        // Or if we can't distribute, just form a small table anyway.
        // For simplicity, we just form a smaller table.
        tables.push([...pool]);
        break;
      }

      const seed = pool[0];
      const others = pool.slice(1);

      // Re-score others based on seed (using a default activity type for Dinner)
      const scoredOthers = others.map(candidate => ({
        ...candidate,
        score: calculateActivityScore(seed, candidate, "吃饭"), 
      }));

      // Select group members
      const selectedOthers = selectBalancedGroup(seed, scoredOthers, TABLE_SIZE, MIN_TABLE_SIZE);
      
      const currentTable = [seed, ...selectedOthers];
      tables.push(currentTable);

      // Remove selected users from pool
      const selectedIds = new Set(currentTable.map(c => c.id));
      pool = pool.filter(c => !selectedIds.has(c.id));
    }

    // 4. Create Match and Event (Table) for each chunk
    let tablesCreated = 0;

    await db.$transaction(async (tx) => {
      for (let i = 0; i < tables.length; i++) {
        const tableGroup = tables[i];
        
        // a. Create a Match
        const match = await tx.match.create({
          data: {
            status: "CONFIRMED",
            city: poolEvent.city,
            ageGroup: "MIXED", // simplified
            expiresAt: new Date(poolEvent.date.getTime() + 24 * 60 * 60 * 1000), // expires 1 day after event
            members: {
              create: tableGroup.map(c => ({
                userId: c.id,
                confirmed: true,
              }))
            }
          }
        });

        // b. Create the Dinner Event
        const dinnerEvent = await tx.event.create({
          data: {
            title: `聚餐分桌 #${i + 1}`,
            type: "DINNER",
            city: poolEvent.city,
            date: poolEvent.date,
            maxAttendees: TABLE_SIZE,
            priceAmount: 0, // already paid
            status: "UPCOMING",
            creatorId: adminUserId, // Admin is creator
            matchId: match.id,
            // Address remains empty until Admin fills it, but it's hidden by reveal logic anyway
            address: "", 
            description: "算法分配的专属餐桌。具体的餐厅信息会在活动开始前 12 小时准时揭晓！",
          }
        });

        // c. Transfer Attendance
        await tx.eventAttendance.createMany({
          data: tableGroup.map(c => ({
            eventId: dinnerEvent.id,
            userId: c.id,
            status: "CONFIRMED",
          }))
        });

        tablesCreated++;
      }

      // 5. Delete the old Pool Attendances and mark Pool Event as COMPLETED
      await tx.eventAttendance.deleteMany({
        where: { eventId: poolEventId }
      });

      await tx.event.update({
        where: { id: poolEventId },
        data: { status: "COMPLETED" }
      });
    });

    return NextResponse.json({ success: true, tablesCreated });
  } catch (error: any) {
    console.error("Matchmaking run error:", error);
    await sendAlert("分桌匹配算法运行失败", error.message || "Unknown Error");
    return NextResponse.json(
      { error: "算法运行失败" },
      { status: 500 }
    );
  }
}
