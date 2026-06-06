/**
 * 轻量级业务告警服务
 * 用于在关键业务路径发生异常时，主动推送告警。
 * 支持 飞书企业自建应用 (Open API) 及 通用 Webhook。
 */

// 缓存 Feishu Token 以减少接口调用频率
let feishuTokenCache: { token: string; expireAt: number } | null = null;

async function getFeishuTenantToken(appId: string, appSecret: string): Promise<string> {
  // Return cached token if valid (with 5 minute buffer)
  if (feishuTokenCache && feishuTokenCache.expireAt > Date.now() + 5 * 60 * 1000) {
    return feishuTokenCache.token;
  }

  const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });

  if (!res.ok) {
    throw new Error(`Feishu token request failed with status: ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Feishu token error: ${data.msg}`);
  }

  feishuTokenCache = {
    token: data.tenant_access_token,
    expireAt: Date.now() + data.expire * 1000
  };

  return data.tenant_access_token;
}

export async function sendAlert(title: string, message: string, context?: any) {
  const env = process.env.NODE_ENV === "production" ? "🔴 生产环境" : "🟡 测试环境";
  const ctxStr = context ? `\n\n上下文:\n${JSON.stringify(context, null, 2)}` : "";
  const fullMessage = `【${env} 异常告警】\n主题: ${title}\n描述: ${message}${ctxStr}`;

  // 1. 优先检查飞书自建应用配置
  const feishuAppId = process.env.FEISHU_APP_ID;
  const feishuAppSecret = process.env.FEISHU_APP_SECRET;
  const feishuReceiveId = process.env.FEISHU_RECEIVE_ID || "13907481106"; // 默认投递给填写的手机号

  if (feishuAppId && feishuAppSecret) {
    try {
      const token = await getFeishuTenantToken(feishuAppId, feishuAppSecret);
      // 根据填写内容的格式判断是手机号还是邮箱，由于是手机号，使用 mobile
      // 若将来需要拓展，可根据 `@` 判断是否为 email
      const receiveIdType = feishuReceiveId.includes("@") ? "email" : "mobile";
      const mobileNumber = receiveIdType === "mobile" && !feishuReceiveId.startsWith("+") 
        ? `+86${feishuReceiveId}` // 飞书 Open API 要求 E.164 格式
        : feishuReceiveId;

      const res = await fetch(`https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
          receive_id: mobileNumber,
          msg_type: "text",
          content: JSON.stringify({ text: fullMessage })
        })
      });

      if (!res.ok) {
        console.error(`[ALERT-FEISHU-FAILED] Status: ${res.status}`);
      } else {
        const body = await res.json();
        if (body.code !== 0) {
           console.error(`[ALERT-FEISHU-FAILED] Code: ${body.code}, Msg: ${body.msg}`);
        }
      }
      return; // 飞书发送成功则返回
    } catch (err) {
      console.error("[ALERT-FEISHU-FAILED] Exception", err);
      // Fallback to webhook if configured below
    }
  }

  // 2. 如果未配置飞书 App，或者飞书发送失败，回退到通用 Webhook 方案
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[ALERT-DISABLED]", title, message, context || "");
    return;
  }

  const webhookType = process.env.ALERT_WEBHOOK_TYPE?.toLowerCase() || "feishu";
  let payload = {};

  if (webhookType === "feishu") {
    payload = { msg_type: "text", content: { text: fullMessage } };
  } else if (webhookType === "dingtalk" || webhookType === "wxwork") {
    payload = { msgtype: "text", text: { content: fullMessage } };
  } else if (webhookType === "slack") {
    payload = { text: fullMessage };
  } else {
    payload = { message: fullMessage };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error(`[ALERT-WEBHOOK-FAILED] Webhook responded with status: ${res.status}`);
  } catch (err) {
    console.error("[ALERT-WEBHOOK-FAILED] Failed to invoke webhook", err);
  }
}
