'use server';

/**
 * 邮件服务器端操作
 * 通过内部 API 与 Bull 队列交互
 *
 * 架构：
 * Server Action → /api/queue/send (Bull queue)
 *   ↓
 * 后台异步处理
 *   ↓
 * 自动重试 3 次（指数退避）
 *   ↓
 * 失败时记录审计日志
 */

interface QueueResponse {
  success: boolean;
  message?: string;
  jobId?: string;
  error?: string;
}

interface StatsResponse {
  success: boolean;
  stats?: {
    pending: number;
    active: number;
    completed: number;
    failed: number;
    failedJobs: any[];
  };
}

/**
 * 将魔法链接邮件添加到队列
 *
 * 流程：
 * 1. 立即入队（< 100ms）
 * 2. 用户立即得到反馈
 * 3. 邮件在后台异步发送
 * 4. 失败自动重试 3 次
 * 5. 最终失败时通知管理员
 */
export async function queueMagicLinkEmail(to: string, link: string): Promise<string> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'magic-link',
        to,
        subject: '登录饭否 - 你的专属饭搭子',
        data: { link },
      }),
    });

    const data = (await response.json()) as QueueResponse;

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to queue email');
    }

    console.log(`[Email] ✅ Magic link email queued for ${to} (job: ${data.jobId})`);
    return data.jobId || `queued-${Date.now()}`;
  } catch (error) {
    console.error('[Email] ❌ Failed to queue magic link email:', error);
    throw error;
  }
}

/**
 * 获取邮件队列统计信息
 */
export async function getEmailQueueStats() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/queue`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = (await response.json()) as StatsResponse;

    if (!response.ok || !data.success) {
      return {
        pending: 0,
        active: 0,
        completed: 0,
        failed: 0,
        failedJobs: [],
      };
    }

    return data.stats || {
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      failedJobs: [],
    };
  } catch (error) {
    console.error('[Email] Failed to get queue stats:', error);
    return {
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      failedJobs: [],
    };
  }
}
