import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee, Dumbbell, Heart, Sparkles, Utensils, Users, ChevronRight } from "lucide-react";

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
      title: "轻松出现",
      description: "无需个人简介、无需滑动匹配。选择活动，出现就好。",
    },
  ];

  const stats = [
    { number: "9", label: "覆盖城市" },
    { number: "20+", label: "兴趣类型" },
    { number: "每周", label: "活动频次" },
    { number: "3步", label: "参与流程" },
  ];

  const activities = [
    { icon: Utensils, title: "聚餐晚宴", desc: "在温暖餐桌里，享受美食和自然对话。" },
    { icon: Coffee, title: "饮品小聚", desc: "轻松环境中，和新朋友交换故事。" },
    { icon: Dumbbell, title: "运动健身", desc: "用共同兴趣开启更有活力的连接。" },
  ];

  return (
    <div className="min-h-screen bg-[#fff9f7] text-[#271f1d]">
      <nav className="sticky top-0 z-40 border-b border-[#f0e4e0] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            饭否
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full text-sm text-[#9d8580]">登录</Button>
            </Link>
            <Link href="/register">
              <Button className="gradient-btn h-9 rounded-full px-5 text-sm text-white">
                注册
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-56px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-semibold text-[#ff2442]">
              <Sparkles className="h-3.5 w-3.5" />
              Thursday Dinner Club
            </div>
            <h1 className="text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              将陌生人变成朋友。
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#8f7771]">
              无需个人简介，无需滑动匹配。饭否把城市里的有趣的人，放到同一张温暖餐桌旁。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button className="gradient-btn h-11 rounded-full px-6 text-white">
                  立即加入
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="h-11 rounded-full border-[#eadbd6] bg-white px-6 text-[#271f1d]">
                  登录
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-lg bg-cover bg-center shadow-[0_24px_70px_rgba(90,35,30,0.18)]" style={{ backgroundImage: "url(/login-hero.jpg)" }}>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,10,8,0.05),rgba(20,10,8,0.58))]" />
            <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-3">
              {stats.slice(0, 3).map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/18 bg-white/14 p-4 text-white backdrop-blur-md">
                  <p className="text-2xl font-semibold">{stat.number}</p>
                  <p className="mt-1 text-sm text-white/82">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#f0e4e0] bg-white/72">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
            {[
              { step: "01", title: "选择活动", desc: "浏览同城餐桌、饮品、运动等聚会。" },
              { step: "02", title: "报名参加", desc: "选定时间，免费或使用券码报名。" },
              { step: "03", title: "出现就好", desc: "准时赴约，剩下交给饭否安排。" },
            ].map((item) => (
              <Card key={item.step} className="rounded-lg border-[#f0e4e0] bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-[#ff2442]">{item.step}</p>
                <h2 className="mt-4 text-xl font-semibold tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#8f7771]">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-[#ff2442]">Mission</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">让城市关系重新变得松弛。</h2>
            <p className="mt-5 text-base leading-8 text-[#8f7771]">
              在越来越忙的生活里，我们相信友谊不应该只靠偶然。饭否用稳定的活动节奏和温和的匹配方式，让人自然相遇。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="rounded-lg border-[#f0e4e0] bg-white p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0ef] text-[#ff2442]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8f7771]">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="bg-[#271f1d] text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-white/60">Activities</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">从一顿饭开始，也可以从共同兴趣开始。</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {activities.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="rounded-lg border-white/10 bg-white/8 p-6 text-white shadow-none backdrop-blur">
                    <Icon className="h-7 w-7 text-[#ff6b5f]" />
                    <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/64">{item.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-4xl font-semibold tracking-tight">准备好加入了吗？</h2>
            <p className="mt-4 text-base text-[#8f7771]">选择你的第一场活动，开始建立真实的友谊。</p>
            <Link href="/register" className="mt-8 inline-flex">
              <Button className="gradient-btn h-12 rounded-full px-8 text-white">
                立即加入
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#f0e4e0]">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-[#9d8580] sm:px-6 lg:px-8">
          饭否 · 将陌生人变成朋友
        </div>
      </footer>
    </div>
  );
}
