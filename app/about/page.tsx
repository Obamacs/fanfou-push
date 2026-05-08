"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Users, Zap, Globe } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "友谊优先",
      description: "我们相信友谊是生活中最重要的因素，能够改变人生、提升幸福感和健康水平。",
    },
    {
      icon: Users,
      title: "真实连接",
      description: "通过精心设计的活动和匹配算法，帮助陌生人建立真实、有意义的友谊。",
    },
    {
      icon: Zap,
      title: "简单易用",
      description: "无需复杂的资料填写，只需出现，我们为你处理其余的一切。",
    },
    {
      icon: Globe,
      title: "全球社区",
      description: "连接全球志同道合的人，与世界各地的朋友建立友谊。",
    },
  ];

  const milestones = [
    { number: "9", label: "覆盖城市" },
    { number: "成长中", label: "全球网络" },
    { number: "Beta", label: "平台阶段" },
    { number: "每周", label: "活动频次" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex flex-col">
              <span className="gradient-text text-2xl font-bold">饭否</span>
              <span className="text-xs text-gray-500">遇见有趣的灵魂</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700">
                登录
              </Button>
            </Link>
            <Link href="/register">
              <Button className="btn-brand text-white">注册</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold gradient-text">关于饭否</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            我们的使命是给世界一个重新出现的机会，帮助人们成为他们希望拥有的朋友
          </p>
        </div>

        {/* Mission Section */}
        <Card className="p-12 bg-gradient-to-br from-pink-50 to-orange-50 border-0">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">我们的使命</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              在一个越来越孤独的世界里，我们相信友谊是最强大的力量。饭否致力于将陌生人变成朋友，
              创造有意义的连接，帮助每个人找到志同道合的伙伴。
            </p>
            <p className="text-lg font-semibold text-[#FF2D55]">
              "当你成为你希望拥有的朋友时，你就会吸引你一直在寻找的友谊。"
            </p>
          </div>
        </Card>

        {/* Core Values */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">核心价值观</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="p-8 border-0 shadow-md card-hover">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center flex-shrink-0">
                      <Icon className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-gray-600">{value.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-[#FF2D55] via-[#FF4D7E] to-[#FF6B35] rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold text-center mb-12">我们的现状</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold mb-2">{milestone.number}</p>
                <p className="text-lg opacity-90">{milestone.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">我们的故事</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 border-0 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">为什么是饭否？</h3>
              <p className="text-gray-600 leading-relaxed">
                在现代社会，尽管我们有无数的社交媒体连接，但真正的友谊变得越来越稀缺。
                饭否应运而生，致力于通过线下活动和真实互动，帮助人们建立深层次的友谊。
              </p>
            </Card>
            <Card className="p-8 border-0 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">我们的方法</h3>
              <p className="text-gray-600 leading-relaxed">
                我们不相信复杂的算法和冗长的资料填写。相反，我们通过精心设计的社交活动
                （聚餐、饮品、运动等）将志同道合的人聚集在一起，让友谊自然而然地发生。
              </p>
            </Card>
          </div>
        </div>

        {/* Philosophy Section */}
        <Card className="p-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">我们的哲学</h2>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg">
                <span className="font-semibold text-[#FF2D55]">成为朋友，看世界如何回应。</span>
                这是我们的核心信念。
              </p>
              <p>
                我们相信，当你主动成为一个好朋友时，你会自然地吸引志同道合的人。
                友谊不是一种交易，而是一种相互的给予和接纳。
              </p>
              <p>
                饭否的每一个活动、每一个匹配、每一个连接，都是为了帮助你成为更好的朋友，
                同时找到你一直在寻找的友谊。
              </p>
            </div>
          </div>
        </Card>

        {/* Activities Section */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">我们的活动</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-8 border-0 shadow-md text-center">
              <p className="text-4xl mb-4">🍽️</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">社交聚餐</h3>
              <p className="text-gray-600">
                在温暖的烛光下，与志同道合的人享受美食和对话，建立深层次的连接。
              </p>
            </Card>
            <Card className="p-8 border-0 shadow-md text-center">
              <p className="text-4xl mb-4">🍹</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">饮品聚会</h3>
              <p className="text-gray-600">
                在轻松的氛围中，与新朋友分享故事、交流想法，享受社交的乐趣。
              </p>
            </Card>
            <Card className="p-8 border-0 shadow-md text-center">
              <p className="text-4xl mb-4">🏃</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">运动聚集</h3>
              <p className="text-gray-600">
                通过共同的运动爱好，与志同道合的人建立友谊，享受健康的生活方式。
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="p-12 bg-gradient-to-r from-[#FF2D55] to-[#FF6B35] text-white border-0 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-lg opacity-95 mb-8 max-w-2xl mx-auto">
            加入饭否社区，找到志同道合的朋友，体验有意义的连接。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-white text-[#FF2D55] hover:bg-gray-100 font-semibold px-8 py-2 h-auto">
                立即加入
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 py-2 h-auto">
                已有账号？登录
              </Button>
            </Link>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>© 2026 饭否. 将陌生人变成朋友。</p>
        </div>
      </footer>
    </div>
  );
}
