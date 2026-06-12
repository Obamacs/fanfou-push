import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(key);
}

export const EMAIL_FROM = process.env.EMAIL_FROM || "饭否 <noreply@mail.meal-meet.com>";

export async function sendMagicLinkEmail(email: string, link: string) {
  const resend = getResend();
  const startTime = Date.now();

  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "登录饭否 - 你的专属饭搭子",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #2D1E1A;">饭否 🍚</h1>
          <p>点击下面的按钮登录你的饭否账号：</p>
          <a href="${link}"
             style="display: inline-block; padding: 14px 32px;
                    background-color: #2D1E1A; color: #fff;
                    text-decoration: none; border-radius: 8px;
                    font-weight: 600; margin: 16px 0;">
            登录饭否
          </a>
          <p style="color: #888; font-size: 14px;">
            该链接有效期为 15 分钟。如果你未请求此邮件，可忽略。
          </p>
        </div>
      `,
    });

    const duration = Date.now() - startTime;

    if (response.error) {
      console.error(`[EMAIL_TELEMETRY] Resend API failed for ${email} in ${duration}ms. Error:`, response.error);
      throw response.error;
    }

    console.log(`[EMAIL_TELEMETRY] Resend API sent email to ${email} successfully in ${duration}ms. MessageID: ${response.data?.id}`);
    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[EMAIL_TELEMETRY] Resend API threw exception for ${email} in ${duration}ms. ErrorDetails:`, error);
    throw error;
  }
}

export async function sendEventRevealEmail(email: string, userName: string, eventTitle: string, restaurantName: string, eventUrl: string) {
  const resend = getResend();
  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "🍽️ 你的周四晚盲盒晚餐已揭晓！",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #2D2420;">
          <h1 style="color: #FF2442;">饭否 🍚</h1>
          <h2>${userName}，你好！</h2>
          <p>恭喜！算法已为您匹配了同城的新朋友。今晚的盲盒晚餐地点已经揭晓：</p>
          <div style="background-color: #FFF5F3; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0;">${eventTitle}</h3>
            <p style="margin: 0;"><strong>餐厅地址：</strong>${restaurantName}</p>
          </div>
          <p>无需做攻略，明天下班后直接赴约即可。点击下方按钮查看聚餐详细信息和同桌参与者：</p>
          <a href="${eventUrl}"
             style="display: inline-block; padding: 14px 32px;
                    background-color: #FF2442; color: #fff;
                    text-decoration: none; border-radius: 8px;
                    font-weight: 600; margin: 16px 0;">
            查看活动详情
          </a>
          <p style="color: #888; font-size: 13px;">
            如果临时有事，请务必提前取消，以免影响同桌伙伴的体验。
          </p>
        </div>
      `,
    });
    if (response.error) {
      console.error("Resend API returned error for reveal email:", response.error);
    }
  } catch (err) {
    console.error("Failed to send reveal email:", err);
  }
}

export async function sendEventReminderEmail(email: string, userName: string, eventTitle: string, eventUrl: string) {
  const resend = getResend();
  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "⏳ 距离晚餐还有 3 小时，准备好迎接惊喜了吗？",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #2D2420;">
          <h1 style="color: #FF2442;">饭否 🍚</h1>
          <h2>${userName}，马上要见面啦！</h2>
          <p>距离 <strong>${eventTitle}</strong> 还有不到 3 小时，下班后带上好心情出发吧。</p>
          <p><strong>接头暗号：</strong> 到店后，请告知服务员您预订了“饭否”的桌位，或向大家展示本邮件/订单记录。</p>
          <p>不要紧张，所有人都是第一次见面，一个真诚的微笑就是最好的开场白。</p>
          <a href="${eventUrl}"
             style="display: inline-block; padding: 14px 32px;
                    background-color: #FF2442; color: #fff;
                    text-decoration: none; border-radius: 8px;
                    font-weight: 600; margin: 16px 0;">
            确认最终地址
          </a>
          <p style="color: #888; font-size: 13px;">
            请注意路况，如果您可能会迟到，建议提前通过活动群聊或向我们报备。祝您今晚愉快！
          </p>
        </div>
      `,
    });
    if (response.error) {
      console.error("Resend API returned error for reminder email:", response.error);
    }
  } catch (err) {
    console.error("Failed to send reminder email:", err);
  }
}
