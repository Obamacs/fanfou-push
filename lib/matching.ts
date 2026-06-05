interface Candidate {
  id: string;
  ageGroup?: string | null;
  gender?: string | null;
  relationshipGoal?: string | null;
  smokingHabit?: string | null;
  drinkingHabit?: string | null;
  wantsChildren?: string | null;
  interests: { interest: { id: string; name: string } }[];
  answers: { questionId: string; answer: string }[];
  score?: number;
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
    if (!a || !b) return 3; // 默认给中间分
    if (a === b) return 5;
    const levels = ["NEVER", "OCCASIONALLY", "REGULARLY"];
    const diff = Math.abs(levels.indexOf(a) - levels.indexOf(b));
    return diff === 1 ? 2 : 0;
  };
  const childScore = (a?: string | null, b?: string | null): number => {
    if (!a || !b) return 3;
    if (a === b) return 5;
    if (a === "OPEN" || b === "OPEN") return 3;
    return 0; // YES vs NO 互斥
  };
  return (
    habitScore(user.smokingHabit, candidate.smokingHabit) +
    habitScore(user.drinkingHabit, candidate.drinkingHabit) +
    childScore(user.wantsChildren, candidate.wantsChildren)
  ); // 满分 15
}

function calculateAgeScore(user: Candidate, candidate: Candidate): number {
  const ageOrder = ["18-25", "26-35", "36-45", "46+"];
  const u = user.ageGroup;
  const c = candidate.ageGroup;
  if (!u || !c) return 10; // 缺失数据时给平均分
  
  const uIdx = ageOrder.indexOf(u);
  const cIdx = ageOrder.indexOf(c);
  if (uIdx === -1 || cIdx === -1) return 10;
  
  const diff = Math.abs(uIdx - cIdx);
  if (diff === 0) return 20; // 完全同龄
  if (diff === 1) return 10; // 相邻年龄段
  if (diff === 2) return 2;  // 跨度较大
  return 0; // 跨度极大
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

function calculateBudgetScore(
  candidate: Candidate,
  userAnswerMap: Map<string, string>
): number {
  // 由于前期运营阶段用户较少，为了让所有价格档次的用户都能顺利配对并参与活动，
  // 用户的用餐预算选择不应对匹配产生任何阻碍或降权惩罚，统一默认给以满分契合度（10分）
  return 10;
}

export function calculateActivityScore(
  user: Candidate,
  candidate: Candidate,
  activityType: string
): number {
  // 1. 活动兴趣 (20%)
  const activityInterestScore = calculateActivityInterestScore(
    candidate,
    activityType
  );
  const weightedActivity = (activityInterestScore / 100) * 20;

  // 2. 年龄兼容度 (20%)
  const weightedAge = calculateAgeScore(user, candidate); // 满分 20

  // 3. 婚恋意向 (15%)
  const goalScore = calculateRelationshipGoalScore(user, candidate); // 满分 35
  const weightedGoal = (goalScore / 35) * 15;

  // 4. 生活习惯 (15%)
  const weightedLifestyle = calculateLifestyleScore(user, candidate); // 满分 15

  // 5. 精准饮食与餐标匹配 (30%)
  const userAnswerMap = new Map<string, string>();
  if (user.answers && Array.isArray(user.answers)) {
    user.answers.forEach((a) => {
      userAnswerMap.set(a.questionId, a.answer);
    });
  }
  const cuisineScore = calculateCuisineScore(candidate, userAnswerMap);
  const tasteScore = calculateTasteScore(candidate, userAnswerMap);
  const dietScore = calculateDietScore(candidate, userAnswerMap);
  const budgetScore = calculateBudgetScore(candidate, userAnswerMap);
  const foodScore = cuisineScore + tasteScore + dietScore + budgetScore; // 最高 47 分
  const weightedFood = (foodScore / 47) * 30;

  const score = weightedActivity + weightedAge + weightedGoal + weightedLifestyle + weightedFood;
  return Math.min(100, Math.max(0, score));
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

  // 阶段 1: 尝试在保证性别名额不超过一半的情况下，选取合格的同桌者
  for (const candidate of sorted) {
    if (selected.length >= targetSize - 1) break;

    // 在宽松模式下，忽略分数阈值，只要有候选人就选择
    if (!useRelaxedMode && candidate.score < scoreThreshold) {
      continue;
    }

    const gender = candidate.gender || "OTHER";
    const currentCount = genderCount[gender] || 0;

    // 优先选择代表性不足的性别（避免某一性别占比过高，比如一桌里不要全是男的）
    if (currentCount <= Math.ceil((targetSize - 1) / 2)) {
      selected.push(candidate);
      genderCount[gender] = currentCount + 1;
    }
  }

  // 阶段 2: 如果因为性别配额卡点导致拼桌人数不足，立刻打破性别限制启动候补机制
  if (selected.length < targetSize - 1) {
    for (const candidate of sorted) {
      if (!selected.includes(candidate) && selected.length < targetSize - 1) {
        selected.push(candidate);
      }
    }
  }

  return selected;
}
