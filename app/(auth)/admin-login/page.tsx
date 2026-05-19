"use client";

import { useState } from "react";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen flex items-center justify-center bg-[#FFF5F3] p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#F0E4E0]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2D2420]">管理员入口</h1>
          <p className="text-sm text-[#B8A099] mt-2">内部管理系统</p>
        </div>

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-6">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleAdminSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#2D2420] mb-2">邮箱</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@meal-meet.com"
              disabled={loading}
              className="rounded-xl h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D2420] mb-2">密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              disabled={loading}
              className="rounded-xl h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1311] hover:bg-[#1A1311] text-white font-semibold h-11 rounded-xl mt-6"
          >
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
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
