/**
 * 轻量级业务告警服务
 * 用于在关键业务路径发生异常时，主动向飞书、钉钉或企业微信等群机器人推送消息。
 */

export async function sendAlert(title: string, message: string, context?: any) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    // 未配置 webhook 时仅输出到终端日志，供 Vercel 记录
    console.warn("[ALERT-DISABLED]", title, message, context || "");
    return;
  }

  // 获取配置的机器人类型（支持 feishu, dingtalk, wxwork），默认推测为 feishu
  const webhookType = process.env.ALERT_WEBHOOK_TYPE?.toLowerCase() || "feishu";
  const env = process.env.NODE_ENV === "production" ? "🔴 生产环境" : "🟡 测试环境";
  
  const ctxStr = context ? `\n\n上下文:\n${JSON.stringify(context, null, 2)}` : "";
  const fullMessage = `【${env} 异常告警】\n主题: ${title}\n描述: ${message}${ctxStr}`;

  let payload = {};

  if (webhookType === "feishu") {
    payload = {
      msg_type: "text",
      content: { text: fullMessage },
    };
  } else if (webhookType === "dingtalk") {
    payload = {
      msgtype: "text",
      text: { content: fullMessage },
    };
  } else if (webhookType === "wxwork") {
    payload = {
      msgtype: "text",
      text: { content: fullMessage },
    };
  } else if (webhookType === "slack") {
    payload = { text: fullMessage };
  } else {
    // Default / Generic JSON fallback
    payload = { message: fullMessage };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      console.error(`[ALERT-FAILED] Webhook responded with status: ${res.status}`);
    }
  } catch (err) {
    console.error("[ALERT-FAILED] Failed to invoke webhook", err);
  }
}
