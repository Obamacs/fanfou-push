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

// Apple-inspired subtle color palette
export const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  "聚餐晚宴": { bg: "bg-orange-50", text: "text-orange-600", icon: "🍽️" },
  "饮品小聚": { bg: "bg-amber-50",  text: "text-amber-600",  icon: "🍸" },
  "运动健身": { bg: "bg-green-50",  text: "text-green-600",  icon: "🏃" },
  "文化娱乐": { bg: "bg-purple-50", text: "text-purple-600", icon: "🎬" },
  "户外探索": { bg: "bg-teal-50",   text: "text-teal-600",   icon: "🏕️" },
  "学习分享": { bg: "bg-blue-50",    text: "text-blue-600",   icon: "📚" },
  "创意手工": { bg: "bg-rose-50",    text: "text-rose-600",   icon: "🎨" },
  "其他":     { bg: "bg-gray-50",    text: "text-gray-600",   icon: "✨" },
};

// Apple-inspired gray scale
export const COLORS = {
  bg:       "#f5f5f7",
  surface:  "#ffffff",
  text:     "#1d1d1f",
  textSecondary: "#86868b",
  border:   "#d2d2d7",
  accent:   "#0071e3",   // Apple blue
} as const;
