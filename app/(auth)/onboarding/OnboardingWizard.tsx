"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { OptionGrid, OptionButton, StepSection } from "@/components/onboarding/OnboardingComponents";
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  GENDER_LABELS,
  RELATIONSHIP_GOAL_OPTIONS,
  HABIT_OPTIONS,
  HABIT_LABELS,
  CHILDREN_OPTIONS,
  CITY_OPTIONS,
  STEP_VALIDATION,
} from "@/lib/onboarding-constants";

interface Interest {
  id: string;
  name: string;
  icon?: string | null;
}

interface Question {
  id: string;
  text: string;
  options: string | null;
}

interface OnboardingState {
  ageGroup: string;
  gender: string;
  relationshipGoal: string;
  smokingHabit: string;
  drinkingHabit: string;
  wantsChildren: string;
  avatar: string;
  selectedInterests: string[];
  city: string;
  answers: Array<{ questionId: string; answer: string }>;
}

interface OnboardingWizardProps {
  interests: Interest[];
  questions: Question[];
  userName: string;
}

export default function OnboardingWizard({
  interests,
  questions,
  userName,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    ageGroup: "",
    gender: "",
    relationshipGoal: "",
    smokingHabit: "",
    drinkingHabit: "",
    wantsChildren: "",
    avatar: "",
    selectedInterests: [],
    city: "",
    answers: [],
  });

  const progress = (step / 8) * 100;

  const updateState = (key: keyof OnboardingState, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleInterestToggle = (interestId: string) => {
    setState((prev) => ({
      ...prev,
      selectedInterests: prev.selectedInterests.includes(interestId)
        ? prev.selectedInterests.filter((id) => id !== interestId)
        : [...prev.selectedInterests, interestId],
    }));
  };

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setState((prev) => ({
      ...prev,
      answers: prev.answers.some((a) => a.questionId === questionId)
        ? prev.answers.map((a) =>
            a.questionId === questionId ? { ...a, answer } : a
          )
        : [...prev.answers, { questionId, answer }],
    }));
  };

  const canProceed = () => {
    const validator = STEP_VALIDATION[step as keyof typeof STEP_VALIDATION];
    return validator ? validator(state, questions.length) : false;
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageGroup: state.ageGroup,
          gender: state.gender,
          relationshipGoal: state.relationshipGoal,
          smokingHabit: state.smokingHabit,
          drinkingHabit: state.drinkingHabit,
          wantsChildren: state.wantsChildren,
          avatar: state.avatar,
          city: state.city,
          interestIds: state.selectedInterests,
          answers: state.answers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "引导保存失败");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("发生错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <StepSection title="你的年龄段是？">
            <OptionGrid
              options={AGE_OPTIONS.map((age) => ({ value: age, label: age }))}
              selectedValue={state.ageGroup}
              onSelect={(val) => updateState("ageGroup", val)}
              columns={2}
            />
          </StepSection>
        );

      case 2:
        return (
          <StepSection title="你的性别是？">
            <OptionGrid
              options={GENDER_OPTIONS.map((g) => ({
                value: g,
                label: GENDER_LABELS[g],
              }))}
              selectedValue={state.gender}
              onSelect={(val) => updateState("gender", val)}
              columns={3}
            />
          </StepSection>
        );

      case 3:
        return (
          <StepSection
            title="你来这里是为了？"
            subtitle="这将帮助我们为你找到更合适的人"
          >
            <div className="space-y-3">
              {RELATIONSHIP_GOAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateState("relationshipGoal", option.value)}
                  className={`w-full p-4 rounded-lg border-2 transition text-left ${
                    state.relationshipGoal === option.value
                      ? "border-[#FF2442] bg-[#FFF0F3]"
                      : "border-[#F0E4E0] bg-white hover:border-[#FF6B35]/30"
                  }`}
                >
                  <div className="font-semibold text-[#2D2420]">
                    {option.label}
                  </div>
                  <div className="text-sm text-[#B8A099]">{option.desc}</div>
                </button>
              ))}
            </div>
          </StepSection>
        );

      case 4:
        return (
          <StepSection title="你的生活方式">
            <div className="space-y-6">
              <div>
                <Label className="block text-sm font-medium text-[#2D2420] mb-3">
                  吸烟习惯
                </Label>
                <OptionGrid
                  options={HABIT_OPTIONS.map((h) => ({
                    value: h,
                    label: HABIT_LABELS[h],
                  }))}
                  selectedValue={state.smokingHabit}
                  onSelect={(val) => updateState("smokingHabit", val)}
                  columns={3}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-[#2D2420] mb-3">
                  饮酒习惯
                </Label>
                <OptionGrid
                  options={HABIT_OPTIONS.map((h) => ({
                    value: h,
                    label: HABIT_LABELS[h],
                  }))}
                  selectedValue={state.drinkingHabit}
                  onSelect={(val) => updateState("drinkingHabit", val)}
                  columns={3}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-[#2D2420] mb-3">
                  关于孩子
                </Label>
                <OptionGrid
                  options={CHILDREN_OPTIONS}
                  selectedValue={state.wantsChildren}
                  onSelect={(val) => updateState("wantsChildren", val)}
                  columns={3}
                />
              </div>
            </div>
          </StepSection>
        );

      case 5:
        return (
          <StepSection title="上传你的头像">
            <ImageUpload
              value={state.avatar}
              onChange={(url) => updateState("avatar", url)}
              label="选择头像"
            />
          </StepSection>
        );

      case 6:
        return (
          <StepSection
            title="选择你的兴趣"
            subtitle="至少选择 3 个兴趣"
          >
            <div className="grid grid-cols-2 gap-2">
              {interests.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => handleInterestToggle(interest.id)}
                  className={`p-3 rounded-lg border-2 transition text-sm ${
                    state.selectedInterests.includes(interest.id)
                      ? "border-[#FF2442] bg-[#FFF0F3] text-[#FF2442]"
                      : "border-[#F0E4E0] bg-white text-[#2D2420] hover:border-[#FF6B35]/30"
                  }`}
                >
                  {interest.icon} {interest.name}
                </button>
              ))}
            </div>
          </StepSection>
        );

      case 7:
        return (
          <StepSection title="你在哪个城市？">
            <div className="space-y-4">
              <Input
                placeholder="输入城市"
                value={state.city}
                onChange={(e) => updateState("city", e.target.value)}
                className="mb-4"
              />
              <div className="grid grid-cols-2 gap-2">
                {CITY_OPTIONS.map((c) => (
                  <OptionButton
                    key={c}
                    value={c}
                    label={c}
                    isSelected={state.city === c}
                    onClick={(val) => updateState("city", val)}
                    className="text-sm"
                  />
                ))}
              </div>
            </div>
          </StepSection>
        );

      case 8:
        return (
          <StepSection title="回答几个问题">
            <div className="space-y-6">
              {questions.map((question) => {
                let options: string[] = [];
                if (question.options) {
                  try {
                    const parsed = JSON.parse(question.options);
                    options = Array.isArray(parsed) ? parsed : [];
                  } catch {
                    options = [];
                  }
                }
                const currentAnswer = state.answers.find(
                  (a) => a.questionId === question.id
                )?.answer;

                return (
                  <div key={question.id}>
                    <Label className="block text-sm font-medium text-[#2D2420] mb-3">
                      {question.text}
                    </Label>
                    <div className="space-y-2">
                      {options.map((option: string) => (
                        <button
                          key={option}
                          onClick={() => handleQuestionAnswer(question.id, option)}
                          className={`w-full p-3 rounded-lg border-2 transition text-sm text-left ${
                            currentAnswer === option
                              ? "border-[#FF2442] bg-[#FFF0F3] text-[#FF2442]"
                              : "border-[#F0E4E0] bg-white text-[#2D2420] hover:border-[#FF6B35]/30"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </StepSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <h1 className="text-2xl font-bold text-[#2D2420]">
                欢迎, {userName}！
              </h1>
              <span className="text-sm text-[#B8A099]">
                第 {step} / 8 步
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {renderStepContent()}

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || loading}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-[#F0E4E0] bg-white h-10 px-4 text-sm font-medium text-[#2D2420] hover:bg-[#FFF5F3] transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              上一步
            </button>
            <button
              type="button"
              onClick={step === 8 ? handleSubmit : () => setStep(step + 1)}
              disabled={!canProceed() || loading}
              className="flex-1 inline-flex items-center justify-center rounded-lg h-10 px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#FF2442] to-[#FF6B35] hover:from-[#FF4D63] hover:to-[#FF8C69] shadow-md transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
            >
              {step === 8 ? (loading ? "提交中..." : "完成引导") : "下一步"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
