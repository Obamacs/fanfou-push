"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("请填写所有字段");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("两次密码不一致");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "注册失败");
        return;
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError("发生错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 */}
      <div className="hidden md:flex md:w-1/2 text-white flex-col justify-center items-center p-8 relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'url(/register-hero-text.jpg)' }}>
        {/* 深色渐变叠加层 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20"></div>

        <div className="text-center z-10">
          <h1 className="text-6xl font-bold mb-6">加入饭否</h1>
          <p className="text-2xl mb-6 font-light">将陌生人变成朋友</p>
          <p className="text-lg opacity-95 max-w-sm leading-relaxed space-y-3">
            <div>无需填写资料，无需繁琐操作</div>
            <div>我们为你匹配志同道合的朋友</div>
            <div className="text-base opacity-90">
              只需要出现，其余的交给我们
            </div>
          </p>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="w-full md:w-1/2 bg-white md:bg-gradient-to-br md:from-[#FFF8F6] md:to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <div className="p-8">
            {/* 移动端logo */}
            <div className="md:hidden text-center mb-8">
              <h1 className="gradient-text text-4xl font-bold">饭否</h1>
              <p className="text-sm text-gray-600 mt-2">遇见同频的人</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">创建账户</h2>
            <p className="text-gray-600 mb-6">加入我们，开始你的社交之旅</p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="请输入你的名字"
                  disabled={loading}
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={loading}
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="至少 8 位字符"
                  disabled={loading}
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="再次输入密码"
                  disabled={loading}
                  className="border-gray-200"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-brand text-white font-semibold h-10"
              >
                {loading ? "注册中..." : "创建账号"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              已有账号？{" "}
              <Link href="/login" className="font-semibold gradient-text">
                立即登录
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
