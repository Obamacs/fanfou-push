"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, X, Edit3, Users } from "lucide-react";

interface Interest {
  id: string;
  name: string;
  icon: string | null;
  _count: { userInterests: number };
}

export default function AdminInterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ name: "", icon: "" });

  useEffect(() => { fetchInterests(); }, []);

  const fetchInterests = async () => {
    try {
      const res = await fetch("/api/admin/interests");
      const data = await res.json();
      setInterests(data.interests || []);
    } catch {
      setError("获取兴趣标签失败");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", icon: "" });
    setEditingId(null);
  };

  const startEdit = (interest: Interest) => {
    setEditingId(interest.id);
    setForm({ name: interest.name, icon: interest.icon || "" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("请输入兴趣名称");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const body: Record<string, unknown> = { name: form.name.trim() };
      if (form.icon.trim()) body.icon = form.icon.trim();

      const method = editingId ? "PATCH" : "POST";
      if (editingId) body.id = editingId;

      const res = await fetch("/api/admin/interests", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      setSuccess(editingId ? "标签已更新" : "标签已创建");
      setTimeout(() => setSuccess(""), 3000);
      resetForm();
      fetchInterests();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个兴趣标签吗？")) return;
    try {
      const res = await fetch(`/api/admin/interests?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "删除失败");
        return;
      }
      fetchInterests();
    } catch {
      setError("网络错误");
    }
  };

  if (loading) {
    return <div className="text-[#B8A099]">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">兴趣管理</h1>
          <p className="text-[#B8A099] mt-1">管理用户在引导流程中可以选择的兴趣标签</p>
        </div>
        <span className="text-[#B8A099] text-sm">{interests.length} 个标签</span>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm">{success}</div>
      )}

      {/* Add/Edit Form */}
      <Card className="bg-[#241918] border-[#2D1E1A] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {editingId ? "编辑标签" : "添加新标签"}
        </h2>
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="block text-sm font-medium text-[#B8A099]">名称 *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如：旅行、摄影、音乐"
              className="bg-[#1A1311] border-[#2D1E1A] text-white placeholder:text-[#6B5A55] rounded-xl"
            />
          </div>
          <div className="w-32 space-y-1">
            <label className="block text-sm font-medium text-[#B8A099]">图标</label>
            <Input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="🎵"
              className="bg-[#1A1311] border-[#2D1E1A] text-white rounded-xl text-center"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#FF2442] to-[#FF6B35] hover:from-[#FF4D63] hover:to-[#FF8C69] text-white rounded-xl"
          >
            {saving ? "保存中..." : editingId ? <><Save className="w-4 h-4 mr-1.5" />保存修改</> : <><Plus className="w-4 h-4 mr-1.5" />添加标签</>}
          </Button>
          {editingId && (
            <Button onClick={resetForm} variant="outline" className="border-[#2D1E1A] text-[#B8A099] rounded-xl">
              <X className="w-4 h-4 mr-1.5" />取消
            </Button>
          )}
        </div>
      </Card>

      {/* Interests Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {interests.map((interest) => (
          <Card
            key={interest.id}
            className="bg-[#241918] border-[#2D1E1A] p-4 text-center group hover:border-[#FF2442]/30 transition-colors"
          >
            <div className="text-3xl mb-2">{interest.icon || "🏷️"}</div>
            <h3 className="font-semibold text-white text-sm mb-1">{interest.name}</h3>
            <div className="flex items-center justify-center gap-1 text-xs text-[#6B5A55]">
              <Users className="w-3 h-3" />
              {interest._count.userInterests}
            </div>
            <div className="flex gap-1 justify-center mt-3 pt-3 border-t border-[#2D1E1A] opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="ghost" onClick={() => startEdit(interest)} className="text-[#B8A099] hover:text-white h-7 px-2">
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(interest.id)} className="text-[#B8A099] hover:text-red-400 h-7 px-2">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {interests.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#6B5A55]">
            暂无兴趣标签，添加第一个吧
          </div>
        )}
      </div>
    </div>
  );
}
