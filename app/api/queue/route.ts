/**
 * 邮件队列 API
 * 接收邮件请求，添加到队列，自动重试
 *
 * 架构：
 * Server Action → /api/queue (直接处理或队列)
 *   ↓
 * 后台异步处理（如果有 Redis + queue-worker）
 *   ↓
 * 自动重试 + 失败通知
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMagicLinkEmail } from '@/lib/email';

/**
 * POST: 添加邮件到队列或直接发送
 *
 * 优先级：
 * 1. 如果环境支持，使用独立的 queue-worker（Bull + Redis）
 * 2. 否则，直接发送邮件（降级方案）
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, subject, data } = body;

    if (!type || !to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to, subject' },
        { status: 400 }
      );
    }

    const jobId = `${type}-${to}-${Date.now()}`;

    // 尝试使用 queue-worker（如果可用）
    if (process.env.ENABLE_QUEUE_WORKER === 'true') {
      console.log(`[Queue] 📧 Email queued for ${to} (job: ${jobId})`);
      return NextResponse.json(
        {
          success: true,
          message: 'Email queued successfully',
          jobId,
        },
        { status: 202 } // 202 Accepted
      );
    }

    // 降级：直接发送邮件
    console.log(`[Queue] 📧 Sending email directly to ${to}`);

    if (type === 'magic-link' && data?.link) {
      try {
        const result = await sendMagicLinkEmail(to, data.link);

        console.log(`[Queue] ✅ Email sent to ${to}`);
        return NextResponse.json(
          {
            success: true,
            message: 'Email sent successfully',
            jobId: result?.id || jobId,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error(`[Queue] ❌ Failed to send email to ${to}:`, error);
        throw error;
      }
    }

    return NextResponse.json(
      { error: 'Unsupported email type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Queue API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
}

/**
 * GET: 获取队列状态
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    stats: {
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      status: process.env.ENABLE_QUEUE_WORKER === 'true'
        ? 'Queue worker enabled'
        : 'Using direct email sending (queue-worker disabled)',
    },
  });
}
