import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Users, Sparkles, Globe, ChevronRight } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "友谊优先",
      description: "真正的友谊能改变生活。我们相信每个人都值得拥有真诚的连接。",
    },
    {
      icon: Users,
      title: "真实连接",
      description: "通过精心策划的聚会，让陌生人在轻松的氛围中自然相识。",
    },
    {
      icon: Sparkles,
      title: "简单直接",
      description: "无需个人简介，无需滑动匹配，无需费心策划。选择活动，出现就好。",
    },
    {
      icon: Globe,
      title: "本地社区",
      description: "从你所在的城市开始，每周都有新的聚会等着你。",
    },
  ];

  const milestones = [
    { number: "9", label: "覆盖城市" },
    { number: "20+", label: "兴趣类型" },
    { number: "每周", label: "活动频次" },
    { number: "3步", label: "参与流程" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#1d1d1f] tracking-tight">
            饭否
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full text-[#86868b] text-sm">登录</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white text-sm font-medium">
                注册
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-20">
        {/* Hero */}
        <div className="text-center space-y-5">
          <h1 className="text-[48px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
            将陌生人<br />变成朋友
          </h1>
          <p className="text-[21px] text-[#86868b] max-w-lg mx-auto leading-relaxed">
            无需个人简介，无需滑动匹配，无需费心策划。<br />
            每周的聚会，让有趣的人自然相遇。
          </p>
        </div>

        {/* How it works */}
        <div className="space-y-6">
          <h2 className="text-[28px] font-bold text-[#1d1d1f] text-center">如何参与</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { step: "1", title: "选择活动", desc: "浏览你所在城市的聚餐、饮品、运动等聚会" },
              { step: "2", title: "报名参加", desc: "选定时间和地点，免费或使用券码报名" },
              { step: "3", title: "出现就好", desc: "准时赴约，其他的交给我们来安排。别紧张，每个人都选择了来这里。" },
            ].map((item) => (
              <Card key={item.step} className="border-0 shadow-sm rounded-3xl p-7 bg-white">
                <div className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center text-sm font-semibold text-[#1d1d1f] mb-5">
                  {item.step}
                </div>
                <h3 className="text-[19px] font-semibold text-[#1d1d1f] mb-2">{item.title}</h3>
                <p className="text-[15px] text-[#86868b] leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission */}
        <Card className="border-0 shadow-sm rounded-3xl p-10 bg-white text-center">
          <h2 className="text-[28px] font-bold text-[#1d1d1f] mb-4">我们的使命</h2>
          <p className="text-[17px] text-[#86868b] max-w-xl mx-auto leading-relaxed">
            在一个越来越孤独的世界里，我们相信友谊是最强大的力量。
            饭否致力于将陌生人变成朋友，创造有意义的连接，
            帮助每个人找到志同道合的伙伴。
          </p>
        </Card>

        {/* Values */}
        <div className="space-y-6">
          <h2 className="text-[28px] font-bold text-[#1d1d1f] text-center">核心价值观</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-0 shadow-sm rounded-3xl p-7 bg-white">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#0071e3]" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">{value.title}</h3>
                      <p className="text-[15px] text-[#86868b] leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Activities */}
        <div className="space-y-6">
          <h2 className="text-[28px] font-bold text-[#1d1d1f] text-center">活动类型</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: "🍽️", title: "聚餐晚宴", desc: "在温馨的氛围中，享受美食与深度对话" },
              { icon: "🍸", title: "饮品小聚", desc: "轻松的环境里，与新朋友分享故事" },
              { icon: "🏃", title: "运动健身", desc: "通过共同的运动爱好，建立友谊与健康" },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-sm rounded-3xl p-7 bg-white text-center">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-[19px] font-semibold text-[#1d1d1f] mb-2">{item.title}</h3>
                <p className="text-[15px] text-[#86868b] leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <Card className="border-0 shadow-sm rounded-3xl p-10 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {milestones.map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-[32px] font-bold text-[#0071e3] mb-1">{m.number}</p>
                <p className="text-[15px] text-[#86868b]">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-5 py-10">
          <h2 className="text-[34px] font-bold text-[#1d1d1f] tracking-tight">
            准备好加入了吗？
          </h2>
          <p className="text-[17px] text-[#86868b]">
            选择你的第一场活动，开始建立真实的友谊
          </p>
          <Link href="/register">
            <Button className="rounded-full px-8 py-3 bg-[#0071e3] hover:bg-[#0077ED] text-white text-[17px] font-semibold h-auto">
              立即加入
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] border-t border-gray-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center text-[13px] text-[#86868b]">
          饭否 · 将陌生人变成朋友
        </div>
      </footer>
    </div>
  );
}
