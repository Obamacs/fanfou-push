"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { signOutAction } from "@/app/actions/auth";
import Link from "next/link";
import { LogOut, Pencil, Sparkles } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  age?: number;
  gender?: string;
  city?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!isMounted) return;
        setProfile(data.user);
        setFormData(data.user);
      } catch (err) {
        console.error("获取个人资料失败:", err);
        if (isMounted) {
          setError("获取个人资料失败");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      const data = await res.json();
      setProfile(data.user);
      setEditing(false);
      setSuccess("个人资料已更新");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-[#9d8580]">加载中...</div>;
  }

  if (!profile) {
    return <div className="py-12 text-center text-[#9d8580]">无法加载个人资料</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex items-center justify-between rounded-lg border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(80,35,30,0.07)] backdrop-blur-xl">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-semibold text-[#ff2442]">
            <Sparkles className="h-3.5 w-3.5" />
            Profile
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#271f1d]">我的资料</h1>
        </div>
        <Button
          onClick={() => {
            if (editing) {
              setFormData(profile);
            }
            setEditing(!editing);
          }}
          variant={editing ? "outline" : "default"}
          className={editing ? "rounded-lg border-[#eadbd6] bg-white" : "rounded-lg bg-[#ff2442] text-white hover:bg-[#ee1838]"}
        >
          {!editing && <Pencil className="mr-1.5 h-4 w-4" />}
          {editing ? "取消" : "编辑"}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      <Card className="surface-card space-y-6 rounded-lg p-6 sm:p-8">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-[#271f1d]">头像</label>
          {editing ? (
            <ImageUpload
              value={formData.avatarUrl || ""}
              onChange={(url) => setFormData((prev) => ({ ...prev, avatarUrl: url }))}
              label="上传头像"
              type="avatar"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff2442] to-[#ff7a59] text-2xl font-bold text-white shadow-[0_18px_40px_rgba(255,36,66,0.18)]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="头像" className="w-full h-full object-cover" />
              ) : (
                profile.email?.[0]?.toUpperCase() || "U"
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#271f1d]">邮箱</label>
          <div className="rounded-lg bg-[#fff4f1] p-3 text-[#271f1d]">{profile.email}</div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#271f1d]">名字</label>
          {editing ? (
            <Input
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="输入你的名字"
              className="rounded-lg border-[#eadbd6] bg-white/90"
            />
          ) : (
            <div className="rounded-lg bg-[#fff4f1] p-3 text-[#271f1d]">{profile.name || "-"}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#271f1d]">年龄</label>
          {editing ? (
            <Input
              name="age"
              type="number"
              value={formData.age || ""}
              onChange={handleChange}
              placeholder="输入你的年龄"
              className="rounded-lg border-[#eadbd6] bg-white/90"
            />
          ) : (
            <div className="rounded-lg bg-[#fff4f1] p-3 text-[#271f1d]">{profile.age || "-"}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#271f1d]">性别</label>
          {editing ? (
            <select
              name="gender"
              value={formData.gender || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
              className="w-full rounded-lg border border-[#eadbd6] bg-white/90 px-3 py-2"
            >
              <option value="">选择性别</option>
              <option value="MALE">男</option>
              <option value="FEMALE">女</option>
              <option value="OTHER">其他</option>
            </select>
          ) : (
            <div className="rounded-lg bg-[#fff4f1] p-3 text-[#271f1d]">
              {profile.gender === "MALE" ? "男" : profile.gender === "FEMALE" ? "女" : profile.gender === "OTHER" ? "其他" : "-"}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#271f1d]">城市</label>
          {editing ? (
            <Input
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              placeholder="输入你的城市"
              className="rounded-lg border-[#eadbd6] bg-white/90"
            />
          ) : (
            <div className="rounded-lg bg-[#fff4f1] p-3 text-[#271f1d]">{profile.city || "-"}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#271f1d]">个人简介</label>
          {editing ? (
            <textarea
              name="bio"
              value={formData.bio || ""}
              onChange={handleChange}
              placeholder="介绍一下你自己"
              rows={4}
              className="w-full rounded-lg border border-[#eadbd6] bg-white/90 px-3 py-2"
            />
          ) : (
            <div className="whitespace-pre-wrap rounded-lg bg-[#fff4f1] p-3 text-[#271f1d]">
              {profile.bio || "-"}
            </div>
          )}
        </div>

        {editing && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-[#ff2442] text-white hover:bg-[#ee1838]"
            >
              {saving ? "保存中..." : "保存修改"}
            </Button>
            <Button
              onClick={() => {
                setEditing(false);
                setFormData(profile);
              }}
              variant="outline"
              className="flex-1 rounded-lg border-[#eadbd6] bg-white"
            >
              取消
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-8 space-y-3">
        <Link href="/onboarding?edit=true">
          <Button variant="outline" className="w-full rounded-lg border-[#eadbd6] bg-white/80">
            重新完成问卷
          </Button>
        </Link>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full rounded-lg border-red-100 bg-white/80 text-red-600 hover:text-red-700">
            <LogOut className="mr-1.5 h-4 w-4" />
            退出登录
          </Button>
        </form>
      </div>
    </div>
  );
}
