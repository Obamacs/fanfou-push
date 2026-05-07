import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateCouponWelcomeText(userName: string): Promise<string> {
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `你是饭否社交平台的助手。请为新用户"${userName}"生成一段温暖、个性化的免费活动券欢迎文案。
要求：
- 50字以内
- 温暖有趣，体现社交聚会的氛围
- 提及这张券可以免费参加一次活动
- 不要用"亲爱的"等过于正式的称呼
请直接输出文案，不要任何前缀或解释。`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      return content.text;
    }
    return `${userName}，欢迎加入饭否！这张券是送给你的第一份礼物，用它免费参加一次心仪的活动吧。`;
  } catch (error) {
    console.error("Claude API error:", error);
    return `${userName}，欢迎来到饭否！这张免费活动券是我们送给你的见面礼，期待在活动中与你相遇。`;
  }
}
