"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight, MailCheck, Sparkles } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterContent() {
  const searchParams = useSearchParams();
  const inviteParam = searchParams.get("invite") || searchParams.get("code") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    inviteCode: inviteParam.toUpperCase(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [devLoginUrl, setDevLoginUrl] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setDevLoginUrl("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("请填写所有字段");
      setLoading(false);
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("名字至少需要 2 个字符");
      setLoading(false);
      return;
    }

    if (!EMAIL_REGEX.test(formData.email)) {
      setError("请输入有效的邮箱地址");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          inviteCode: formData.inviteCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "注册失败");
        return;
      }

      setSuccess(
        data.couponIssued
          ? "注册成功！你已获得一张免费券，请检查邮箱验证"
          : "注册成功！验证链接已发送到你的邮箱"
      );
      if (data.devLoginUrl) {
        setDevLoginUrl(data.devLoginUrl);
      }
      setEmailSent(true);
    } catch (err) {
      console.error("Register error:", err);
      setError("发生错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setDevLoginUrl("");

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "重新发送失败，请稍后重试");
        return;
      }

      setSuccess("新的验证链接已发送，请查收邮箱");
      if (data.devLoginUrl) {
        setDevLoginUrl(data.devLoginUrl);
      }
    } catch (err) {
      console.error("Resend register magic link error:", err);
      setError("重新发送失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f7] lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <div
        className="relative hidden overflow-hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-end xl:p-14"
        style={{ backgroundImage: "url(/login-hero.jpg)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(18,10,9,0.78),rgba(18,10,9,0.36)_48%,rgba(255,36,66,0.14))]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            只需出现，剩下的交给饭否
          </div>
          <h1 className="max-w-xl text-6xl font-semibold leading-[0.98] tracking-tight xl:text-7xl">
            新朋友，从一顿好好吃饭开始。
          </h1>
          <div className="mt-8 grid max-w-xl gap-3">
            {[
              ["01", "完成轻量问卷，让匹配更懂你。"],
              ["02", "报名周四晚 20:00 的同城餐桌。"],
              ["03", "周三匹配同桌，活动前揭晓餐厅。"],
            ].map(([step, text]) => (
              <div key={step} className="flex items-center gap-4 rounded-lg border border-white/18 bg-white/12 p-4 backdrop-blur-md">
                <span className="text-sm font-semibold text-white">{step}</span>
                <span className="text-sm leading-6 text-white/86">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0">
        <Card className="surface-card w-full max-w-md rounded-lg border-white/70 p-0 shadow-[0_24px_70px_rgba(90,35,30,0.12)]">
          <div className="p-7 sm:p-9">
            <div className="mb-8 lg:hidden">
              <h1 className="gradient-text text-4xl font-semibold tracking-tight">饭否</h1>
              <p className="mt-2 text-sm text-[#9d8580]">每周四晚，一场 6 个人的盲盒晚餐</p>
            </div>

            {emailSent ? (
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff2442]/10 text-[#ff2442]">
                  <MailCheck className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#271f1d]">请查收邮件</h2>
                <p className="mt-3 text-sm leading-6 text-[#9d8580]">验证链接已发送到</p>
                <p className="mt-1 break-all font-semibold text-[#271f1d]">{formData.email}</p>
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-left text-sm leading-6 text-amber-800">
                  链接 15 分钟内有效。邮件可能需要 1-3 分钟送达，若未收到，请检查收件箱和垃圾邮件后再重新发送。
                </div>
                {success && (
                  <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-left text-sm text-green-700">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
                    {error}
                  </div>
                )}
                {devLoginUrl && (
                  <div className="mt-5 p-4 rounded-lg border border-red-200 bg-red-50 text-left">
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">⚙️ 开发环境快捷通道</p>
                    <a
                      href={devLoginUrl}
                      className="block text-center w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                      一键登录并进入 onboarding (免邮箱)
                    </a>
                  </div>
                )}
                <Button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="gradient-btn mt-5 h-12 w-full text-white"
                >
                  {loading ? "发送中..." : "重新发送验证链接"}
                </Button>
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setSuccess("");
                    setFormData({ name: "", email: "", inviteCode: "" });
                    setDevLoginUrl("");
                  }}
                  variant="outline"
                  className="mt-5 w-full rounded-lg border-[#eadbd6] bg-white"
                >
                  使用其他邮箱
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-semibold text-[#ff2442]">
                    <Sparkles className="h-3.5 w-3.5" />
                    New table
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight text-[#271f1d]">创建账户</h2>
                  <p className="mt-3 text-sm leading-6 text-[#9d8580]">留下名字和邮箱，先为你的周四晚留一个位置。</p>
                </div>

                {error && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && !emailSent && (
                  <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#271f1d]">名字</label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="你的名字"
                      disabled={loading}
                      className="h-12 rounded-lg border-[#eadbd6] bg-white/90 px-4"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#271f1d]">邮箱</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="h-12 rounded-lg border-[#eadbd6] bg-white/90 px-4"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#271f1d]">
                      邀请码 <span className="font-normal text-[#9d8580]">(可选)</span>
                    </label>
                    <Input
                      type="text"
                      name="inviteCode"
                      value={formData.inviteCode}
                      onChange={handleChange}
                      placeholder="填写邀请码领取免费券"
                      disabled={loading}
                      className="h-12 rounded-lg border-[#eadbd6] bg-white/90 px-4 uppercase font-mono tracking-wider"
                    />
                    {formData.inviteCode && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#ff2442] font-semibold tracking-wide">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        已填入邀请码，注册时将自动验证；有效后可获得免费餐券。
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="gradient-btn mt-6 h-12 w-full text-white"
                  >
                    {loading ? "注册中..." : "注册并发送验证链接"}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>

                <div className="mt-7 text-center text-sm text-[#9d8580]">
                  已有账号？{" "}
                  <Link href="/login" className="font-semibold gradient-text hover:opacity-80 transition-opacity">
                    立即登录
                  </Link>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white">加载中...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
