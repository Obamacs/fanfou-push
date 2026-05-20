import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || "饭否 <noreply@meal-meet.com>";

export async function sendMagicLinkEmail(email: string, link: string) {
  const resend = getResend();
  const { error } = await resend.emails.send({
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
  if (error) {
    console.error("Resend send error:", error);
    throw error;
  }
}
