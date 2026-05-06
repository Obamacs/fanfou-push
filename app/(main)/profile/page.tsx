"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Link from "next/link";

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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setProfile(data.user);
      setFormData(data.user);
    } catch (err) {
      console.error("获取个人资料失败:", err);
      setError("获取个人资料失败");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12">无法加载个人资料</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的资料</h1>
        <Button
          onClick={() => {
            if (editing) {
              setFormData(profile);
            }
            setEditing(!editing);
          }}
          variant={editing ? "outline" : "default"}
          className={editing ? "" : "bg-[#FF2D55] hover:bg-[#FF2D55]/90 text-white"}
        >
          {editing ? "取消" : "编辑"}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <Card className="bg-white border border-gray-200 p-8 space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-900">头像</label>
          {editing ? (
            <ImageUpload
              value={formData.avatarUrl || ""}
              onChange={(url) => setFormData((prev) => ({ ...prev, avatarUrl: url }))}
              label="上传头像"
              type="avatar"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="头像" className="w-full h-full object-cover" />
              ) : (
                profile.email?.[0]?.toUpperCase() || "U"
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">邮箱</label>
          <div className="p-3 bg-gray-50 rounded-lg text-gray-700">{profile.email}</div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">名字</label>
          {editing ? (
            <Input
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="输入你的名字"
              className="border-gray-200"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700">{profile.name || "-"}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">年龄</label>
          {editing ? (
            <Input
              name="age"
              type="number"
              value={formData.age || ""}
              onChange={handleChange}
              placeholder="输入你的年龄"
              className="border-gray-200"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700">{profile.age || "-"}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">性别</label>
          {editing ? (
            <select
              name="gender"
              value={formData.gender || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">选择性别</option>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700">{profile.gender || "-"}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">城市</label>
          {editing ? (
            <Input
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              placeholder="输入你的城市"
              className="border-gray-200"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700">{profile.city || "-"}</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">个人简介</label>
          {editing ? (
            <textarea
              name="bio"
              value={formData.bio || ""}
              onChange={handleChange}
              placeholder="介绍一下你自己"
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
              {profile.bio || "-"}
            </div>
          )}
        </div>

        {editing && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#FF2D55] hover:bg-[#FF2D55]/90 text-white"
            >
              {saving ? "保存中..." : "保存修改"}
            </Button>
            <Button
              onClick={() => {
                setEditing(false);
                setFormData(profile);
              }}
              variant="outline"
              className="flex-1"
            >
              取消
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-8 space-y-3">
        <Link href="/onboarding">
          <Button variant="outline" className="w-full">
            重新完成问卷
          </Button>
        </Link>
        <form
          action={async () => {
            const { signOut } = await import("@/lib/auth");
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline" className="w-full text-red-600 hover:text-red-700">
            退出登录
          </Button>
        </form>
      </div>
    </div>
  );
}
