/**
 * 事件状态工具函数
 */

import { db } from '@/lib/db';

/**
 * 计算事件应该有的状态
 */
export function calculateEventStatus(eventDate: Date): string {
  const now = new Date();
  const timeDiff = now.getTime() - eventDate.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  if (hoursDiff > 3) {
    return 'COMPLETED';
  } else if (hoursDiff > -3) {
    return 'ONGOING';
  } else {
    return 'UPCOMING';
  }
}

/**
 * 更新单个事件的状态（如果需要）
 * 返回更新后的状态
 */
export async function ensureEventStatusUpdated(eventId: string): Promise<string> {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { date: true, status: true },
    });

    if (!event) {
      console.warn(`[EventStatus] Event ${eventId} not found`);
      return 'UNKNOWN';
    }

    const calculatedStatus = calculateEventStatus(event.date);

    // 只有状态改变时才更新
    if (calculatedStatus !== event.status) {
      await db.event.update({
        where: { id: eventId },
        data: { status: calculatedStatus as any },
      });

      console.log(
        `[EventStatus] Updated event ${eventId} status from ${event.status} to ${calculatedStatus}`
      );
    }

    return calculatedStatus;
  } catch (error) {
    console.error(`[EventStatus] Error updating event ${eventId}:`, error);
    return 'UNKNOWN';
  }
}

/**
 * 批量更新所有需要更新的事件状态
 */
export async function batchUpdateEventStatuses(): Promise<{ total: number; updated: number }> {
  try {
    const events = await db.event.findMany({
      where: {
        status: { in: ['UPCOMING', 'ONGOING'] },
      },
      select: { id: true, date: true, status: true },
    });

    let updated = 0;

    for (const event of events) {
      const calculatedStatus = calculateEventStatus(event.date);

      if (calculatedStatus !== event.status) {
        await db.event.update({
          where: { id: event.id },
          data: { status: calculatedStatus as any },
        });

        updated++;
        console.log(
          `[EventStatus] Updated event ${event.id} status from ${event.status} to ${calculatedStatus}`
        );
      }
    }

    return { total: events.length, updated };
  } catch (error) {
    console.error('[EventStatus] Error batch updating event statuses:', error);
    return { total: 0, updated: 0 };
  }
}
