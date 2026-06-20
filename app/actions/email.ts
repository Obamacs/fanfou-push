'use server';

import { sendMagicLinkEmail } from '@/lib/email';

/**
 * 邮件队列包装器（当前使用直接发送）
 * TODO: 集成 Bull 队列用于生产环境重试
 *
 * 目前的实现：
 * - 直接发送邮件（快速）
 * - 不支持重试（简单）
 * - 足够用于开发和早期阶段
 *
 * 未来改进：
 * - 添加 Bull + Redis 队列
 * - 实现自动重试机制
 * - 添加失败通知
 * - 邮件统计和监控
 */

export async function queueMagicLinkEmail(to: string, link: string): Promise<string> {
  try {
    // TODO: 当 Bull 队列集成时，改为异步队列操作
    // 现在直接发送邮件 - 用户需要等待邮件发送完成
    const result = await sendMagicLinkEmail(to, link);

    console.log(`[Email] Magic link sent to ${to}`);
    return result?.id || `direct-${Date.now()}`;
  } catch (error) {
    console.error('[Email] Failed to send magic link email:', error);
    throw error;
  }
}

export async function getEmailQueueStats() {
  // TODO: 当集成 Bull 时实现
  return {
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    failedJobs: [],
  };
}
