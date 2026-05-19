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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const errorParam = searchParams.get("error");
  const detailsParam = searchParams.get("details");
  const successParam = searchParams.get("success");

  useEffect(() => {
    if (errorParam) {
      const detailText = detailsParam ? `（${detailsParam}）` : "";
      switch (errorParam) {
        case "access_denied":
          setError(`验证链接已失效或已被使用，请重新发送 ${detailText}`);
          break;
        case "otp_expired":
          setError(`验证链接已过期，请重新发送 ${detailText}`);
          break;
        case "exchange_failed":
          setError(`登录验证失败 ${detailText}`);
          break;
        case "missing_code":
        case "missing_bridge_params":
          setError("验证链接不完整，请重新发送");
          break;
        case "session_failed":
        case "bridge_exception":
          setError(`会话建立失败 ${detailText}`);
          break;
        default:
          setError(`验证失败 ${detailText || "，请重新登录"}`);
      }
    }
    if (successParam) {
      setSuccess("邮件已发送，请检查你的邮箱");
    }
  }, [errorParam, detailsParam, successParam]);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

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

      setSentEmail(email);
      setEmailSent(true);
      setSuccess("验证链接已发送到你的邮箱，请检查邮件");
    } catch (err) {
      console.error("Magic link error:", err);
      setError("发生错误，请重试");
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
        <div className="text-center z-10 max-w-xl space-y-4 px-4">
          <h1 className="text-8xl font-semibold tracking-tight leading-none text-white">饭否</h1>
          <p className="text-2xl font-light leading-relaxed text-white">每周四晚的盲盒社交晚餐</p>
          <div className="text-base font-light leading-relaxed text-white/90 pt-4 space-y-2 text-left bg-black/20 p-6 rounded-2xl backdrop-blur-sm inline-block">
            <p>📍 选择所在城市，报名预订本周四晚的聚餐座位。</p>
            <p>🤖 周三晚，算法将为你精准匹配 5 位同频的陌生人作为同桌。</p>
            <p>🤫 周四活动前 12 小时，才为你揭晓神秘餐厅的真实地址。</p>
            <p className="font-medium pt-2 text-center text-[#FFFAF8]">不用做攻略，不用尬聊破冰，只需准时赴约。</p>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-white md:bg-gradient-to-br md:from-[#FFF8F6] md:to-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">📬</div>
              <h2 className="text-2xl font-bold text-[#2D2420]">请查收邮件</h2>
              <p className="text-[#B8A099] text-sm">我们已将验证链接发送到：</p>
              <p className="font-semibold text-[#2D2420] break-all">{sentEmail}</p>
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 text-left">
                <p className="font-semibold mb-1">💡 提示：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>请检查收件箱和垃圾邮件</li>
                  <li>链接 5 分钟内有效</li>
                  <li>点击邮件中的链接完成登录</li>
                </ul>
              </div>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setSentEmail("");
                  setEmail("");
                  setSuccess("");
                }}
                variant="outline"
                className="w-full mt-4"
              >
                使用其他邮箱
              </Button>
            </div>
          ) : (
          <div className="space-y-8">
            <div className="md:hidden text-center mb-8">
              <h1 className="gradient-text text-4xl font-bold">饭否</h1>
              <p className="text-sm text-[#B8A099] mt-2">每周四晚，一场 6 个人的盲盒晚餐</p>
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-[#2D2420] mb-2">
                欢迎回来
              </h2>
              <p className="text-[#B8A099] text-sm">
                输入邮箱，我们将发送验证链接
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

            <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#2D2420] mb-3">邮箱</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="border-[#F0E4E0] rounded-xl h-11"
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

            <div className="text-center text-sm text-[#B8A099]">
              还没有账号？{" "}
              <Link href="/register" className="font-semibold gradient-text hover:opacity-80 transition-opacity">
                立即注册
              </Link>
            </div>
          </div>
          )}
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
