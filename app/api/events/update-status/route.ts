/**
 * 自动更新事件状态
 * 根据事件日期自动设置状态：
 * - 如果当前时间 > 事件日期 + 3小时 → COMPLETED
 * - 如果当前时间 在事件前后3小时内 → ONGOING
 * - 否则 → UPCOMING
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, date: true, status: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // 计算新状态
    const now = new Date();
    const eventDate = new Date(event.date);
    const timeDiff = now.getTime() - eventDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    let newStatus = 'UPCOMING';

    if (hoursDiff > 3) {
      // 事件已结束超过 3 小时
      newStatus = 'COMPLETED';
    } else if (hoursDiff > -3) {
      // 事件即将开始或进行中（前 3 小时 + 后 3 小时）
      newStatus = 'ONGOING';
    }

    // 只有状态改变时才更新数据库
    if (newStatus !== event.status) {
      await db.event.update({
        where: { id: eventId },
        data: { status: newStatus as any },
      });

      console.log(
        `[EventStatus] Updated event ${eventId} status from ${event.status} to ${newStatus}`
      );
    }

    return NextResponse.json({
      success: true,
      eventId,
      status: newStatus,
      updated: newStatus !== event.status,
    });
  } catch (error) {
    console.error('[EventStatus] Error updating event status:', error);
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
}

/**
 * 批量更新所有事件的状态
 * 用于定期同步，例如每小时运行一次
 */
export async function GET(req: NextRequest) {
  try {
    // 获取所有"即将开始"或"进行中"的事件
    const events = await db.event.findMany({
      where: {
        status: { in: ['UPCOMING', 'ONGOING'] },
      },
      select: { id: true, date: true, status: true },
    });

    const now = new Date();
    let updated = 0;

    for (const event of events) {
      const eventDate = new Date(event.date);
      const timeDiff = now.getTime() - eventDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      let newStatus = 'UPCOMING';

      if (hoursDiff > 3) {
        newStatus = 'COMPLETED';
      } else if (hoursDiff > -3) {
        newStatus = 'ONGOING';
      }

      if (newStatus !== event.status) {
        await db.event.update({
          where: { id: event.id },
          data: { status: newStatus as any },
        });

        updated++;
        console.log(
          `[EventStatus] Updated event ${event.id} status from ${event.status} to ${newStatus}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      total: events.length,
      updated,
      message: `Updated ${updated}/${events.length} events`,
    });
  } catch (error) {
    console.error('[EventStatus] Error batch updating event statuses:', error);
    return NextResponse.json(
      { error: 'Failed to batch update event statuses' },
      { status: 500 }
    );
  }
}
