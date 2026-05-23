"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Users, Link2, ToggleLeft, ToggleRight, RefreshCw, Search } from "lucide-react";

interface InviteUsage {
  id: string;
  newUserName: string;
  newUserEmail: string;
  usedAt: string;
  firstEventAt: string | null;
  rewardClaimedAt: string | null;
}

interface InviteCode {
  id: string;
  code: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  usages: InviteUsage[];
}

export function InviteManager() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/invites?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCodes(data.codes);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const toggleCode = async (codeId: string, isActive: boolean) => {
    setActionLoading(codeId);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", codeId, isActive: !isActive }),
      });
      if (res.ok) fetchCodes();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const generateAll = async () => {
    setActionLoading("all");
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateAll" }),
      });
      const data = await res.json();
      if (res.ok) alert(`已为 ${data.generated} 位用户生成邀请码（共 ${data.total} 位缺失）`);
      fetchCodes();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const shareUrl = (code: string) => `https://meal-meet.com/r/${code}`;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  const totalUsages = codes.reduce((sum, c) => sum + c.usageCount, 0);
  const activeCodes = codes.filter((c) => c.isActive).length;
  const convertedUsages = codes.reduce(
    (sum, c) => sum + c.usages.filter((u) => u.firstEventAt).length, 0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2420]">邀请管理</h1>
          <p className="text-sm text-[#B8A099] mt-1">
            管理所有用户邀请码、查看转化数据
          </p>
        </div>
        <Button
          onClick={generateAll}
          disabled={actionLoading === "all"}
          className="rounded-xl bg-[#FF2442] hover:bg-[#FF4D63] text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${actionLoading === "all" ? "animate-spin" : ""}`} />
          为所有用户生成邀请码
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "邀请码总数", value: codes.length, icon: Link2 },
          { label: "激活中", value: activeCodes, icon: ToggleRight },
          { label: "总使用次数", value: totalUsages, icon: Users },
          { label: "已转化（参加活动）", value: convertedUsages, icon: Users },
        ].map((s) => (
          <Card key={s.label} className="p-4 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <s.icon className="w-5 h-5 text-[#B8A099]" />
              <div>
                <p className="text-2xl font-bold text-[#2D2420]">{s.value}</p>
                <p className="text-xs text-[#B8A099]">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8A099]" />
          <Input
            placeholder="搜索邀请码、用户名或邮箱..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 rounded-xl border-[#F0E4E0]"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FFFAF8] border-b border-[#F0E4E0]">
              <tr>
                <th className="text-left p-4 font-semibold text-[#2D2420]">邀请码</th>
                <th className="text-left p-4 font-semibold text-[#2D2420]">所有者</th>
                <th className="text-center p-4 font-semibold text-[#2D2420]">使用次数</th>
                <th className="text-center p-4 font-semibold text-[#2D2420]">已转化</th>
                <th className="text-center p-4 font-semibold text-[#2D2420]">状态</th>
                <th className="text-right p-4 font-semibold text-[#2D2420]">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#B8A099]">加载中...</td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#B8A099]">暂无数据</td></tr>
              ) : codes.map((c) => {
                const converted = c.usages.filter((u) => u.firstEventAt).length;
                return (
                  <tr key={c.id} className="border-b border-[#F0E4E0] hover:bg-[#FFFAF8]">
                    <td className="p-4">
                      <span className="font-mono text-[15px] font-semibold text-[#2D2420] tracking-wider">
                        {c.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-[#2D2420]">{c.ownerName}</p>
                      <p className="text-xs text-[#B8A099]">{c.ownerEmail}</p>
                    </td>
                    <td className="p-4 text-center font-semibold">{c.usageCount}</td>
                    <td className="p-4 text-center">
                      <span className={converted > 0 ? "text-green-600 font-semibold" : "text-[#B8A099]"}>
                        {converted}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {c.isActive ? "激活" : "已停用"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyText(shareUrl(c.code))}
                          className="text-xs text-[#B8A099] hover:text-[#FF2442]"
                        >
                          复制链接
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleCode(c.id, c.isActive)}
                          disabled={actionLoading === c.id}
                          className={c.isActive ? "text-amber-600" : "text-green-600"}
                        >
                          {c.isActive ? "停用" : "启用"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between p-4 border-t border-[#F0E4E0]">
            <p className="text-sm text-[#B8A099]">共 {total} 条</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                上一页
              </Button>
              <Button size="sm" variant="outline" disabled={page * 50 >= total} onClick={() => setPage(page + 1)}>
                下一页
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Usage details for each code */}
      {codes.filter((c) => c.usages.length > 0).length > 0 && (
        <Card className="border-0 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2D2420] mb-4">最近邀请记录</h2>
          <div className="space-y-3">
            {codes.flatMap((c) =>
              c.usages.slice(0, 3).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-[#FFFAF8] rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[#FF2442]">{c.code}</span>
                    <span className="text-[#B8A099]">→</span>
                    <div>
                      <p className="text-sm font-medium text-[#2D2420]">{u.newUserName}</p>
                      <p className="text-xs text-[#B8A099]">{u.newUserEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#B8A099]">
                    <span>注册: {new Date(u.usedAt).toLocaleDateString("zh-CN")}</span>
                    {u.firstEventAt && (
                      <span className="text-green-600">首次活动: {new Date(u.firstEventAt).toLocaleDateString("zh-CN")}</span>
                    )}
                    {!u.rewardClaimedAt && u.firstEventAt && (
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">奖励待领取</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
