interface Candidate {
  id: string;
  gender?: string | null;
  relationshipGoal?: string | null;
  smokingHabit?: string | null;
  drinkingHabit?: string | null;
  wantsChildren?: string | null;
  interests: { interestId: string }[];
  answers: { questionId: string; answer: string }[];
}

interface Question {
  id: string;
  weight: number;
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

export function calculateScore(
  user: Candidate,
  candidate: Candidate,
  questions: Question[],
  relaxedMode: boolean = false
): number {
  // 宽松模式：人数不足时，降低匹配标准
  if (relaxedMode) {
    // 在宽松模式下，只考虑基本兼容性，忽略年龄、爱好等细节
    // 返回一个较高的基础分数，确保能找到足够的人

    // 婚恋意向分（最高30分）- 保留此项以确保基本兼容
    const goalScore = calculateRelationshipGoalScore(user, candidate);

    // 在宽松模式下，给予所有候选人较高的基础分数
    // 这样可以确保活动有足够的人数
    const baseScore = 50; // 基础分数

    return baseScore + goalScore;
  }

  // 严格模式：正常的多维度匹配
  // 共同兴趣分（最高25分）
  const userInterestIds = new Set(user.interests.map((i) => i.interestId));
  const sharedInterests = candidate.interests.filter((i) =>
    userInterestIds.has(i.interestId)
  ).length;
  const interestScore = (Math.min(sharedInterests, 5) / 5) * 25;

  // 问卷相似度分（最高15分）
  const userAnswerMap = new Map(
    user.answers.map((a) => [a.questionId, a.answer])
  );
  let weightedMatches = 0;
  let totalWeight = 0;

  for (const q of questions) {
    // 跳过菜系、口味、饮食问题，单独计算
    if (["q-cuisine-1", "q-taste-1", "q-diet-1"].includes(q.id)) continue;

    const userAnswer = userAnswerMap.get(q.id);
    const candidateAnswer = candidate.answers.find(
      (a) => a.questionId === q.id
    )?.answer;

    if (userAnswer && candidateAnswer) {
      totalWeight += q.weight;
      if (userAnswer === candidateAnswer) {
        weightedMatches += q.weight;
      }
    }
  }

  const questionScore =
    totalWeight > 0 ? (weightedMatches / totalWeight) * 15 : 0;

  // 菜系偏好分（最高15分）
  const cuisineScore = calculateCuisineScore(candidate, userAnswerMap);

  // 口味偏好分（最高12分）
  const tasteScore = calculateTasteScore(candidate, userAnswerMap);

  // 饮食习惯分（最高10分）
  const dietScore = calculateDietScore(candidate, userAnswerMap);

  // 婚恋意向分（最高30分）
  const goalScore = calculateRelationshipGoalScore(user, candidate);

  // 生活方式分（最高13分）
  const lifestyleScore = calculateLifestyleScore(user, candidate);

  return (
    interestScore +
    questionScore +
    cuisineScore +
    tasteScore +
    dietScore +
    goalScore +
    lifestyleScore
  );
}

export function selectBalancedGroup(
  currentUser: Candidate,
  candidates: (Candidate & { score: number })[],
  targetSize: number = 6,
  minCandidates: number = 3
): (Candidate & { score: number })[] {
  // 如果候选人数量不足，使用宽松模式
  // 宽松模式：忽略年龄、爱好等差别，优先确保活动有足够人数
  const useRelaxedMode = candidates.length < minCandidates * 2;

  // Sort by score descending
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  // Try to balance genders: aim for roughly equal split
  const selected: (Candidate & { score: number })[] = [];
  const genderCount: Record<string, number> = {};

  // Count current user's gender
  if (currentUser.gender) {
    genderCount[currentUser.gender] = 1;
  }

  // 在宽松模式下，降低选择标准
  const scoreThreshold = useRelaxedMode ? 30 : 50; // 宽松模式下分数阈值更低

  // Select candidates while maintaining gender balance
  for (const candidate of sorted) {
    if (selected.length >= targetSize - 1) break;

    // 在宽松模式下，忽略分数阈值，只要有候选人就选择
    if (!useRelaxedMode && candidate.score < scoreThreshold) {
      break;
    }

    const gender = candidate.gender || "OTHER";
    const currentCount = genderCount[gender] || 0;

    // Prefer candidates of underrepresented gender
    // Allow adding if: gender count is less than half of total, or we need to fill slots
    if (currentCount <= Math.ceil((targetSize - 1) / 2) || selected.length < targetSize - 2) {
      selected.push(candidate);
      genderCount[gender] = currentCount + 1;
    }
  }

  // If we don't have enough, just take the top candidates
  if (selected.length < targetSize - 1) {
    for (const candidate of sorted) {
      if (!selected.includes(candidate) && selected.length < targetSize - 1) {
        selected.push(candidate);
      }
    }
  }

  return selected;
}
