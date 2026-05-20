"use client";

import { useState } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

function AdminLoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

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
    <div className="min-h-screen bg-[#fff9f7] lg:grid lg:grid-cols-[1fr_1fr]">
      <div
        className="relative hidden overflow-hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14"
        style={{ backgroundImage: "url(/dashboard-bg.jpg)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(16,9,8,0.82),rgba(16,9,8,0.44)_52%,rgba(255,36,66,0.16))]" />
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="text-2xl font-semibold tracking-tight">饭否</Link>
          <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md">
            Admin Console
          </span>
        </div>

        <div className="relative z-10 max-w-xl pb-4">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4" />
            只为运营团队开放
          </div>
          <h1 className="text-6xl font-semibold leading-[0.98] tracking-tight xl:text-7xl">
            让每一桌都被好好照看。
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/82">
            管理活动、用户、问卷和匹配流程，在后台保持安静、高效、可靠。
          </p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0">
        <div className="surface-card w-full max-w-md rounded-lg p-7 shadow-[0_24px_70px_rgba(90,35,30,0.12)] sm:p-9">
          <div className="mb-8 lg:hidden">
            <h1 className="gradient-text text-4xl font-semibold tracking-tight">饭否</h1>
            <p className="mt-2 text-sm text-[#9d8580]">内部管理系统</p>
          </div>

          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-semibold text-[#ff2442]">
              <Sparkles className="h-3.5 w-3.5" />
              Admin
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#271f1d]">管理员入口</h2>
            <p className="mt-3 text-sm leading-6 text-[#9d8580]">输入内部账号，进入运营控制台。</p>
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

        <form onSubmit={handleAdminSubmit} className="space-y-5">
          <div>
            <label className="mb-3 block text-sm font-semibold text-[#271f1d]">邮箱</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@meal-meet.com"
              disabled={loading}
              className="h-12 rounded-lg border-[#eadbd6] bg-white/90 px-4"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-[#271f1d]">密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              disabled={loading}
              className="h-12 rounded-lg border-[#eadbd6] bg-white/90 px-4"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="gradient-btn mt-6 h-12 w-full text-white"
          >
            {loading ? "登录中..." : "登录"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white">加载中...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
