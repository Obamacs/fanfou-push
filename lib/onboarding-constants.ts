// Onboarding 常量配置

export const AGE_OPTIONS = ["18-25", "26-35", "36-45", "46+"];

export const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"];

export const GENDER_LABELS: Record<string, string> = {
  MALE: "男",
  FEMALE: "女",
  OTHER: "其他",
};

export const RELATIONSHIP_GOAL_OPTIONS = [
  { value: "SERIOUS", label: "认真找对象", desc: "希望找到长期伴侣，走向婚姻" },
  { value: "OPEN", label: "随缘交友", desc: "保持开放心态，看看有没有缘分" },
  { value: "FRIENDSHIP", label: "先交朋友", desc: "先建立友谊，慢慢了解再说" },
];

export const HABIT_OPTIONS = ["NEVER", "OCCASIONALLY", "REGULARLY"];

export const HABIT_LABELS: Record<string, string> = {
  NEVER: "从不",
  OCCASIONALLY: "偶尔",
  REGULARLY: "经常",
};

export const CHILDREN_OPTIONS = [
  { value: "YES", label: "一定要孩子" },
  { value: "NO", label: "不想要孩子" },
  { value: "OPEN", label: "可以有也可以没有" },
];

export const CITY_OPTIONS = ["长沙", "北京", "上海", "广州", "深圳", "成都", "杭州", "武汉", "南京", "宜春"];

interface OnboardingValidationState {
  ageGroup: string;
  gender: string;
  relationshipGoal: string;
  smokingHabit: string;
  drinkingHabit: string;
  wantsChildren: string;
  selectedInterests: string[];
  city: string;
  answers: Array<{ questionId: string; answer: string }>;
  refundMethod: string;
  refundAccount: string;
  refundRealName: string;
}

// Validation rules for each step
export const STEP_VALIDATION = {
  1: (state: OnboardingValidationState) => state.ageGroup !== "",
  2: (state: OnboardingValidationState) => state.gender !== "",
  3: (state: OnboardingValidationState) => state.relationshipGoal !== "",
  4: (state: OnboardingValidationState) =>
    state.smokingHabit !== "" &&
    state.drinkingHabit !== "" &&
    state.wantsChildren !== "",
  5: () => true, // 头像可选
  6: (state: OnboardingValidationState) => state.selectedInterests.length >= 3, // 至少选3个兴趣
  7: (state: OnboardingValidationState) => state.city !== "",
  8: (state: OnboardingValidationState) => {
    // 退款信息可选，但如果选了方式，就建议上传图片和姓名（这里为了用户友好，不做强制硬阻挡，也可以做部分校验）
    // 为了容易操作，这里设为完全可选，可以在后台校验，或者让用户随时跳过
    if (state.refundMethod) {
      return state.refundAccount !== "" && state.refundRealName !== "";
    }
    return true;
  },
  9: (state: OnboardingValidationState, questionsCount: number) =>
    state.answers.length === questionsCount,
};
