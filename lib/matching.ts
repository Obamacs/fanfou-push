interface Candidate {
  id: string;
  gender?: string | null;
  relationshipGoal?: string | null;
  smokingHabit?: string | null;
  drinkingHabit?: string | null;
  wantsChildren?: string | null;
  interests: { interest: { id: string; name: string } }[];
  answers: { questionId: string; answer: string }[];
}

interface Question {
  id: string;
  weight: number;
}

// 活动类型与兴趣的映射
const ACTIVITY_INTEREST_MAP: Record<string, string[]> = {
  "吃饭": ["美食", "烹饪"],
  "运动": ["运动", "健身", "户外"],
  "看电影": ["电影"],
  "看展览": ["艺术", "摄影"],
  "唱歌": ["音乐"],
  "旅行": ["旅行", "户外"],
  "读书": ["读书"],
  "茶艺": ["茶艺"],
  "棋牌": ["棋牌"],
  "舞蹈": ["舞蹈"],
  "游戏": ["游戏"],
  "摄影": ["摄影"],
  "手工": ["手工"],
  "冥想": ["冥想"],
};

// 计算用户对活动的兴趣匹配度
function calculateActivityInterestScore(
  candidate: Candidate,
  activityType: string
): number {
  const relevantInterests = ACTIVITY_INTEREST_MAP[activityType] || [];
  if (relevantInterests.length === 0) return 50; // 如果活动类型未知，给予中等分数

  const candidateInterestNames = candidate.interests.map(
    (i) => i.interest.name
  );
  const matchedInterests = candidateInterestNames.filter((name) =>
    relevantInterests.includes(name)
  ).length;

  // 如果有匹配的兴趣，给予高分；否则给予低分
  return matchedInterests > 0 ? 80 + matchedInterests * 10 : 30;
}

function calculateRelationshipGoalScore(
  user: Candidate,
  candidate: Candidate
): number {
  const u = user.relationshipGoal;
  const c = candidate.relationshipGoal;
  if (!u || !c) return 0;
  if (u === c && u === "SERIOUS") return 35;
  if (u === c && u === "OPEN") return 25;
  if ((u === "SERIOUS" && c === "OPEN") || (u === "OPEN" && c === "SERIOUS"))
    return 15;
  if (u === c && u === "FRIENDSHIP") return 20;
  return 10;
}

function calculateLifestyleScore(
  user: Candidate,
  candidate: Candidate
): number {
  const habitScore = (a?: string | null, b?: string | null): number => {
    if (!a || !b) return 0;
    if (a === b) return 5;
    const levels = ["NEVER", "OCCASIONALLY", "REGULARLY"];
    const diff = Math.abs(levels.indexOf(a) - levels.indexOf(b));
    return diff === 1 ? 3 : 0;
  };
  return (
    habitScore(user.smokingHabit, candidate.smokingHabit) +
    habitScore(user.drinkingHabit, candidate.drinkingHabit) +
    habitScore(user.wantsChildren, candidate.wantsChildren)
  );
}

function calculateCuisineScore(
  candidate: Candidate,
  userAnswerMap: Map<string, string>
): number {
  const userCuisine = userAnswerMap.get("q-cuisine-1");
  const candidateCuisine = candidate.answers.find(
    (a) => a.questionId === "q-cuisine-1"
  )?.answer;

  if (!userCuisine || !candidateCuisine) return 0;
  if (userCuisine === candidateCuisine) return 15;
  return 5;
}

function calculateTasteScore(
  candidate: Candidate,
  userAnswerMap: Map<string, string>
): number {
  const userTaste = userAnswerMap.get("q-taste-1");
  const candidateTaste = candidate.answers.find(
    (a) => a.questionId === "q-taste-1"
  )?.answer;

  if (!userTaste || !candidateTaste) return 0;
  if (userTaste === candidateTaste) return 12;

  const tasteOrder = ["清淡", "微辣", "中辣", "重口味", "无辣不欢"];
  const userIdx = tasteOrder.indexOf(userTaste);
  const candidateIdx = tasteOrder.indexOf(candidateTaste);

  if (userIdx !== -1 && candidateIdx !== -1) {
    const diff = Math.abs(userIdx - candidateIdx);
    return diff === 1 ? 8 : 3;
  }
  return 3;
}

function calculateDietScore(
  candidate: Candidate,
  userAnswerMap: Map<string, string>
): number {
  const userDiet = userAnswerMap.get("q-diet-1");
  const candidateDiet = candidate.answers.find(
    (a) => a.questionId === "q-diet-1"
  )?.answer;

  if (!userDiet || !candidateDiet) return 0;
  if (userDiet === candidateDiet) return 10;
  if (userDiet === "无禁忌" || candidateDiet === "无禁忌") return 6;
  return 2;
}

export function calculateActivityScore(
  user: Candidate,
  candidate: Candidate,
  activityType: string
): number {
  // 核心：根据活动类型匹配感兴趣的人
  const activityInterestScore = calculateActivityInterestScore(
    candidate,
    activityType
  );

  // 基本兼容性：婚恋意向
  const goalScore = calculateRelationshipGoalScore(user, candidate);

  // 性别平衡考虑（轻权重）
  const genderBonus =
    user.gender && candidate.gender && user.gender !== candidate.gender ? 10 : 0;

  // 总分 = 活动兴趣(权重70%) + 婚恋意向(权重20%) + 性别平衡(权重10%)
  return activityInterestScore * 0.7 + (goalScore / 35) * 20 + genderBonus;
}

export function selectBalancedGroup(
  currentUser: Candidate,
  candidates: (Candidate & { score: number })[],
  targetSize: number = 6,
  minCandidates: number = 3
): (Candidate & { score: number })[] {
  // 按分数排序（高分优先）
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  // 尝试平衡性别：目标是大致相等的分割
  const selected: (Candidate & { score: number })[] = [];
  const genderCount: Record<string, number> = {};

  // 计算当前用户的性别
  if (currentUser.gender) {
    genderCount[currentUser.gender] = 1;
  }

  // 在人数不足时，降低分数要求
  const useRelaxedMode = candidates.length < minCandidates * 2;
  const scoreThreshold = useRelaxedMode ? 20 : 40; // 宽松模式下分数阈值更低

  // 选择候选人，同时保持性别平衡
  for (const candidate of sorted) {
    if (selected.length >= targetSize - 1) break;

    // 在宽松模式下，忽略分数阈值，只要有候选人就选择
    if (!useRelaxedMode && candidate.score < scoreThreshold) {
      break;
    }

    const gender = candidate.gender || "OTHER";
    const currentCount = genderCount[gender] || 0;

    // 优先选择代表性不足的性别
    // 如果：性别计数少于总数的一半，或者我们需要填充空位
    if (
      currentCount <= Math.ceil((targetSize - 1) / 2) ||
      selected.length < targetSize - 2
    ) {
      selected.push(candidate);
      genderCount[gender] = currentCount + 1;
    }
  }

  // 如果人数不足，直接选择排名靠前的候选人
  if (selected.length < targetSize - 1) {
    for (const candidate of sorted) {
      if (!selected.includes(candidate) && selected.length < targetSize - 1) {
        selected.push(candidate);
      }
    }
  }

  return selected;
}
