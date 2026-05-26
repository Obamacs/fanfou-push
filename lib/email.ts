import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || "饭否 <noreply@mail.meal-meet.com>";

export async function sendMagicLinkEmail(email: string, link: string) {
  const resend = getResend();
  const startTime = Date.now();

  try {
    const response = await resend.emails.send({
      from: FROM,
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
