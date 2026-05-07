"use client";

import { useState, useEffect } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loginMode, setLoginMode] = useState<"magic" | "admin">("magic");
  const [location, setLocation] = useState<{
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);

  const errorParam = searchParams.get("error");
  const successParam = searchParams.get("success");

  useEffect(() => {
    if (errorParam) {
      setError("验证链接无效或已过期，请重新登录");
    }
    if (successParam) {
      setSuccess("邮件已发送，请检查你的邮箱");
    }
  }, [errorParam, successParam]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
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

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // 验证邮箱
    if (!email) {
      setError("请输入邮箱");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("请输入有效的邮箱地址");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "发送失败，请重试");
        return;
      }

      // 异步更新位置，不阻塞主流程
      if (location?.latitude && location?.longitude) {
        fetch("/api/user/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city,
          }),
        }).catch((err) => console.error("位置更新失败:", err));
      }

      setSuccess("验证链接已发送到你的邮箱，请检查邮件");
      setEmail("");
    } catch (err) {
      console.error("Magic link error:", err);
      setError("发生错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // 验证输入
    if (!email || !password) {
      setError("邮箱和密码为必填项");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("请输入有效的邮箱地址");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少为 6 位");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error("Admin login error:", result.error);
        setError("邮箱或密码错误");
        return;
      }

      if (result?.ok) {
        setSuccess("登录成功，正在跳转...");
        // 使用 router 而不是 window.location 以获得更好的 UX
        setTimeout(() => {
          window.location.href = "/admin";
        }, 500);
      }
    } catch (err) {
      console.error("Admin login exception:", err);
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden md:flex md:w-1/2 text-white flex-col justify-start items-center pt-40 px-16 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url(/login-hero-final.jpg)", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        <div className="text-center z-10 max-w-xl space-y-4">
          <h1 className="text-8xl font-semibold tracking-tight leading-none text-white">饭否</h1>
          <p className="text-2xl font-light leading-relaxed text-white">将陌生人变成朋友</p>
          <p className="text-base font-light leading-relaxed text-white/80 pt-2">
            每周的聚会，让有趣的人自然相遇
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-white md:bg-gradient-to-br md:from-[#FFF8F6] md:to-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="space-y-8">
            <div className="md:hidden text-center mb-8">
              <h1 className="gradient-text text-4xl font-bold">饭否</h1>
              <p className="text-sm text-gray-600 mt-2">遇见有趣的灵魂</p>
            </div>

            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setLoginMode("magic");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  loginMode === "magic"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                用户登录
              </button>
              <button
                onClick={() => {
                  setLoginMode("admin");
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  loginMode === "admin"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                管理员登录
              </button>
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                {loginMode === "magic" ? "欢迎回来" : "管理员登录"}
              </h2>
              <p className="text-gray-500 text-sm">
                {loginMode === "magic"
                  ? "输入邮箱，我们将发送验证链接"
                  : "输入邮箱和密码登录管理后台"}
              </p>
            </div>

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                ✅ {success}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                ❌ {error}
              </div>
            )}

            {loginMode === "magic" ? (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">邮箱</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                    className="border-gray-200 rounded-xl h-11"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-brand text-white font-semibold h-11 rounded-xl mt-6"
                >
                  {loading ? "发送中..." : "发送验证链接"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">邮箱</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@meal-meet.com"
                    disabled={loading}
                    className="border-gray-200 rounded-xl h-11"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">密码</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            )}

            {loginMode === "magic" && (
              <div className="text-center text-sm text-gray-600">
                还没有账号？{" "}
                <Link href="/register" className="font-semibold gradient-text hover:opacity-80 transition-opacity">
                  立即注册
                </Link>
              </div>
            )}
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
