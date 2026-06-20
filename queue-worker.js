#!/usr/bin/env node

/**
 * 独立的 Bull 邮件队列 Worker
 * 在后台运行，与 Next.js 应用分离
 * 这样可以避免 Next.js 构建系统的限制
 */

const Bull = require('bull');
const { sendMagicLinkEmail } = require('./lib/email');

const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

async function startWorker() {
  try {
    console.log('[Worker] Starting email queue worker...');

    const emailQueue = new Bull('emails', { redis });

    // 处理邮件发送
    await emailQueue.process(async (job) => {
      const { type, to, data } = job.data;
      const startTime = Date.now();

      try {
        if (type === 'magic-link' && data?.link) {
          await sendMagicLinkEmail(to, data.link);
        } else {
          throw new Error(`Unsupported email type: ${type}`);
        }

        const duration = Date.now() - startTime;
        console.log(`[Worker] ✅ Email sent to ${to} in ${duration}ms`);
        return { success: true };
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(
          `[Worker] ❌ Email send failed for ${to} after ${duration}ms (attempt ${job.attemptsMade}/3):`,
          error.message
        );
        throw error;
      }
    });

    emailQueue.on('completed', (job) => {
      console.log(`[Worker] ✅ Job ${job.id} completed`);
    });

    emailQueue.on('failed', (job, err) => {
      console.error(`[Worker] ❌ Job ${job.id} failed permanently:`, err.message);
    });

    console.log('[Worker] ✅ Email queue worker started successfully');
    console.log('[Worker] Waiting for jobs...');
  } catch (error) {
    console.error('[Worker] ❌ Failed to start worker:', error);
    process.exit(1);
  }
}

startWorker();

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n[Worker] Shutting down...');
  process.exit(0);
});
