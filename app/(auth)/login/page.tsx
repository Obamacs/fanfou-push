"use client";

import { useState, useEffect } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const successMessage = searchParams.get("registered") === "true" ? "注册成功，请登录" : "";

  // 获取用户位置信息
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // 使用反向地理编码获取城市名称
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.county || "未知";
            setLocation({ city, latitude, longitude });
          } catch (err) {
            console.error("地理编码失败:", err);
            setLocation({ latitude, longitude });
          }
        },
        (error) => {
          console.log("位置获取失败:", error.message);
        }
      );
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("请填写所有字段");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (!result?.ok) {
        const errorMsg = result?.error || "登录失败，请检查邮箱和密码";
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // 登录成功后，更新用户位置信息
      if (location?.latitude && location?.longitude) {
        try {
          await fetch("/api/user/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: location.latitude,
              longitude: location.longitude,
              city: location.city,
            }),
          });
        } catch (err) {
          console.error("位置更新失败:", err);
        }
      }

      // 检查用户是否完成onboarding
      const userRes = await fetch("/api/user/profile");
      const userData = await userRes.json();

      if (!userData.user?.isOnboarded) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "发生错误，请重试";
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 - 苹果风极简高级感 */}
      <div className="hidden md:flex md:w-1/2 text-white flex-col justify-start items-center pt-40 px-16 relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'url(/login-hero-final.jpg)', backgroundPosition: 'center' }}>
        {/* 柔和深色渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>

        {/* 文字容器 - 苹果风格清晰层级 */}
        <div className="text-center z-10 max-w-xl space-y-4">
          {/* 主标题 - 品牌名 */}
          <h1 className="text-8xl font-semibold tracking-tight leading-none text-white">饭否</h1>

          {/* 第二层级 - 品牌解释 */}
          <p className="text-2xl font-light leading-relaxed text-white">将陌生人变成朋友</p>

          {/* 辅助说明 - 更轻更小 */}
          <p className="text-base font-light leading-relaxed text-white/80 pt-2">每周的聚会，让有趣的人自然相遇</p>
        </div>
      </div>

      {/* 右侧表单区 - 苹果风简洁 */}
      <div className="w-full md:w-1/2 bg-white md:bg-gradient-to-br md:from-[#FFF8F6] md:to-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="space-y-8">
            {/* 移动端logo */}
            <div className="md:hidden text-center mb-8">
              <h1 className="gradient-text text-4xl font-bold">饭否</h1>
              <p className="text-sm text-gray-600 mt-2">遇见有趣的灵魂</p>
            </div>

            {/* 标题区 */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">欢迎回来</h2>
              <p className="text-gray-500 text-sm">登录你的账户继续冒险</p>
            </div>

            {/* 消息提示 */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                ✅ {successMessage}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                ❌ {error}
              </div>
            )}

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  邮箱
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="border-gray-200 rounded-xl h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  密码
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="输入密码"
                  disabled={loading}
                  className="border-gray-200 rounded-xl h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-brand text-white font-semibold h-11 rounded-xl mt-6"
              >
                {loading ? "登录中..." : "登录"}
              </Button>
            </form>

            {/* 注册链接 */}
            <div className="text-center text-sm text-gray-600">
              还没有账号？{" "}
              <Link href="/register" className="font-semibold gradient-text hover:opacity-80 transition-opacity">
                立即注册
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white">加载中...</div>}>
      <LoginContent />
    </Suspense>
  );
}
