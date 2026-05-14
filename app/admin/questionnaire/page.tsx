"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, X, Edit3 } from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: string;
  options: string | null;
  weight: number;
  order: number;
  _count: { answers: number };
}

export default function AdminQuestionnairePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    text: "",
    type: "single",
    options: "",
    weight: 1.0,
    order: 0,
  });

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/admin/questionnaire");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setError("获取问题列表失败");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ text: "", type: "single", options: "", weight: 1.0, order: 0 });
    setEditingId(null);
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      text: q.text,
      type: q.type,
      options: q.options || "",
      weight: q.weight,
      order: q.order,
    });
  };

  const handleSave = async () => {
    if (!form.text.trim()) {
      setError("请输入问题文本");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const body: Record<string, unknown> = {
        text: form.text.trim(),
        type: form.type,
        weight: form.weight,
        order: form.order,
      };
      if (form.options.trim()) {
        try {
          body.options = JSON.parse(form.options);
        } catch {
          body.options = form.options.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }

      const method = editingId ? "PATCH" : "POST";
      if (editingId) body.id = editingId;

      const res = await fetch("/api/admin/questionnaire", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      setSuccess(editingId ? "问题已更新" : "问题已创建");
      setTimeout(() => setSuccess(""), 3000);
      resetForm();
      fetchQuestions();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个问题吗？")) return;
    try {
      const res = await fetch(`/api/admin/questionnaire?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "删除失败");
        return;
      }
      fetchQuestions();
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
          <h1 className="text-3xl font-bold text-white">问卷管理</h1>
          <p className="text-[#B8A099] mt-1">管理引导流程中的问题和选项</p>
        </div>
        <span className="text-[#B8A099] text-sm">{questions.length} 个问题</span>
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
          {editingId ? "编辑问题" : "添加新问题"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-[#B8A099]">问题文本 *</label>
            <Input
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="例如：你更喜欢什么类型的约会？"
              className="bg-[#1A1311] border-[#2D1E1A] text-white placeholder:text-[#6B5A55] rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#B8A099]">类型</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 bg-[#1A1311] border border-[#2D1E1A] text-white rounded-xl"
            >
              <option value="single">单选</option>
              <option value="multiple">多选</option>
              <option value="text">文本</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#B8A099]">选项</label>
            <Input
              value={form.options}
              onChange={(e) => setForm({ ...form, options: e.target.value })}
              placeholder='可选，JSON数组或逗号分隔，如: "A","B","C"'
              className="bg-[#1A1311] border-[#2D1E1A] text-white placeholder:text-[#6B5A55] rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#B8A099]">权重</label>
            <Input
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
              className="bg-[#1A1311] border-[#2D1E1A] text-white rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#B8A099]">排序</label>
            <Input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              className="bg-[#1A1311] border-[#2D1E1A] text-white rounded-xl"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#FF2442] to-[#FF6B35] hover:from-[#FF4D63] hover:to-[#FF8C69] text-white rounded-xl"
          >
            {saving ? "保存中..." : editingId ? <><Save className="w-4 h-4 mr-1.5" />保存修改</> : <><Plus className="w-4 h-4 mr-1.5" />添加问题</>}
          </Button>
          {editingId && (
            <Button onClick={resetForm} variant="outline" className="border-[#2D1E1A] text-[#B8A099] rounded-xl">
              <X className="w-4 h-4 mr-1.5" />取消
            </Button>
          )}
        </div>
      </Card>

      {/* Questions List */}
      <Card className="bg-[#241918] border-[#2D1E1A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1311] border-b border-[#2D1E1A]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">#</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">问题</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">类型</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">选项</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">回答数</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-[#B8A099]">操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id} className="hover:bg-[#1A1311]/50 border-b border-[#2D1E1A] last:border-0">
                  <td className="px-6 py-4 text-[#B8A099] text-sm">{i + 1}</td>
                  <td className="px-6 py-4 text-white text-sm max-w-xs truncate">{q.text}</td>
                  <td className="px-6 py-4 text-[#B8A099] text-sm">
                    {q.type === "single" ? "单选" : q.type === "multiple" ? "多选" : "文本"}
                  </td>
                  <td className="px-6 py-4 text-[#B8A099] text-sm max-w-[200px] truncate">
                    {q.options || "-"}
                  </td>
                  <td className="px-6 py-4 text-white text-sm">{q._count.answers}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(q)}
                        className="text-[#B8A099] hover:text-white"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(q.id)}
                        className="text-[#B8A099] hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6B5A55]">
                    暂无问题，添加第一个问卷问题吧
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
