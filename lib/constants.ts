// 活动类型 — 参考 timeleft.com 的 Dinners / Drinks / Runs 模式
export const EVENT_TYPES = [
  "聚餐晚宴",
  "饮品小聚",
  "运动健身",
  "文化娱乐",
  "户外探索",
  "学习分享",
  "创意手工",
  "其他",
] as const;

export const CITIES = [
  "长沙",
  "北京",
  "上海",
  "广州",
  "深圳",
  "成都",
  "杭州",
  "武汉",
  "南京",
] as const;

// Xiaohongshu-inspired warm color palette
export const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  "聚餐晚宴": { bg: "bg-red-50",   text: "text-red-600",   icon: "🍽️" },
  "饮品小聚": { bg: "bg-rose-50",  text: "text-rose-600",  icon: "🍸" },
  "运动健身": { bg: "bg-orange-50", text: "text-orange-600", icon: "🏃" },
  "文化娱乐": { bg: "bg-pink-50",  text: "text-pink-600",  icon: "🎬" },
  "户外探索": { bg: "bg-amber-50", text: "text-amber-600", icon: "🏕️" },
  "学习分享": { bg: "bg-red-50",   text: "text-red-500",   icon: "📚" },
  "创意手工": { bg: "bg-rose-50",  text: "text-rose-500",  icon: "🎨" },
  "其他":     { bg: "bg-stone-50", text: "text-stone-600",  icon: "✨" },
};

// Xiaohongshu-inspired warm color tokens
export const COLORS = {
  bg:       "#FFFAF8",
  surface:  "#FFFFFF",
  text:     "#2D2420",
  textSecondary: "#B8A099",
  border:   "#F0E4E0",
  accent:   "#FF2442",
} as const;
