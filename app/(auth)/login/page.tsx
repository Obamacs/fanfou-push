"use client";

import { useState } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CalendarCheck, MailCheck, MapPin, Sparkles, UsersRound } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const detailsParam = searchParams.get("details");
  const successParam = searchParams.get("success");
  const detailText = detailsParam ? `（${detailsParam}）` : "";
  const initialError = (() => {
    switch (errorParam) {
      case "access_denied":
        return `验证链接已失效或已被使用，请重新发送 ${detailText}`;
      case "otp_expired":
        return `验证链接已过期，请重新发送 ${detailText}`;
      case "exchange_failed":
        return `登录验证失败 ${detailText}`;
      case "missing_code":
      case "missing_bridge_params":
        return "验证链接不完整，请重新发送";
      case "session_failed":
      case "bridge_exception":
        return `会话建立失败 ${detailText}`;
      default:
        return errorParam ? `验证失败 ${detailText || "，请重新登录"}` : "";
    }
  })();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState(successParam ? "邮件已发送，请检查你的邮箱" : "");
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

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
    <div className="min-h-screen bg-[#fff9f7] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <div
        className="hidden lg:flex text-white flex-col justify-between p-10 xl:p-14 relative overflow-hidden bg-cover"
        style={{ backgroundImage: "url(/login-hero.jpg)", backgroundPosition: "center 48%" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(16,9,8,0.78)_0%,rgba(16,9,8,0.36)_48%,rgba(255,36,66,0.16)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="text-2xl font-semibold tracking-tight">饭否</Link>
          <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md">
            Thursday Dinner Club
          </span>
        </div>

        <div className="relative z-10 max-w-2xl pb-4">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            每周四晚，6 人一桌
          </div>
          <h1 className="max-w-xl text-6xl font-semibold leading-[0.98] tracking-tight xl:text-7xl">
            把晚餐交给一点未知。
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/82">
            输入邮箱回到你的城市餐桌。周三完成匹配，周四揭晓餐厅，不做攻略，也不用提前表演自己。
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: MapPin, label: "同城入池" },
              { icon: UsersRound, label: "算法组桌" },
              { icon: CalendarCheck, label: "周四赴约" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-lg border border-white/18 bg-white/12 p-4 backdrop-blur-md">
                <Icon className="mb-3 h-5 w-5 text-white" />
                <div className="text-sm font-medium text-white/95">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0">
        <div className="w-full max-w-md">
          {emailSent ? (
            <div className="surface-card rounded-lg p-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff2442]/10 text-[#ff2442]">
                <MailCheck className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#271f1d]">请查收邮件</h2>
              <p className="mt-3 text-sm leading-6 text-[#9d8580]">验证链接已发送到</p>
              <p className="mt-1 break-all font-semibold text-[#271f1d]">{sentEmail}</p>
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-left text-sm leading-6 text-amber-800">
                链接 5 分钟内有效。若未收到，请检查收件箱和垃圾邮件。
              </div>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setSentEmail("");
                  setEmail("");
                  setSuccess("");
                }}
                variant="outline"
                className="mt-5 w-full rounded-lg border-[#eadbd6] bg-white"
              >
                使用其他邮箱
              </Button>
            </div>
          ) : (
          <div className="surface-card rounded-lg p-7 shadow-[0_24px_70px_rgba(90,35,30,0.12)] sm:p-9">
            <div className="mb-8 lg:hidden">
              <h1 className="gradient-text text-4xl font-semibold tracking-tight">饭否</h1>
              <p className="mt-2 text-sm text-[#9d8580]">每周四晚，一场 6 个人的盲盒晚餐</p>
            </div>

            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-semibold text-[#ff2442]">
                <Sparkles className="h-3.5 w-3.5" />
                Magic link
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-[#271f1d]">
                欢迎回来
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#9d8580]">
                输入邮箱，我们会发送一封无需密码的登录邮件。
              </p>
            </div>

            {success && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
              <div>
                <label className="mb-3 block text-sm font-semibold text-[#271f1d]">邮箱</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="h-12 rounded-lg border-[#eadbd6] bg-white/90 px-4"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="gradient-btn mt-6 h-12 w-full text-white"
              >
                {loading ? "发送中..." : "发送验证链接"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-7 text-center text-sm text-[#9d8580]">
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
