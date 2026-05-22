"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: string;
  email: string;
  name: string;
  city: string;
  gender: string | null;
  isActive: boolean;
  isBanned: boolean;
  role: string;
  canCreateEvents: boolean;
  createdAt: string;
  _count: { eventsCreated: number; eventAttendances: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBanned, setFilterBanned] = useState(false);

  // 一键赠券相关状态
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftWelcomeText, setGiftWelcomeText] = useState("");
  const [giftDaysValid, setGiftDaysValid] = useState("90");
  const [isGifting, setIsGifting] = useState(false);
  const [giftSuccessMsg, setGiftSuccessMsg] = useState("");
  const [giftErrorMsg, setGiftErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (res.ok && isMounted) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !isBanned }),
      });

      if (res.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, isBanned: !isBanned } : u
          )
        );
      }
    } catch (err) {
      console.error("Failed to ban user:", err);
    }
  };

  const handleToggleEventCreation = async (userId: string, canCreateEvents: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canCreateEvents: !canCreateEvents }),
      });

      if (res.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, canCreateEvents: !canCreateEvents } : u
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle event creation:", err);
    }
  };

  const handleOpenGiftModal = (user: User) => {
    setSelectedUser(user);
    setGiftWelcomeText(`亲爱的 ${user.name}，感谢您成为饭否的尊贵会员！特此赠送您一张专属晚餐券，祝您用餐且社交愉快！`);
    setGiftDaysValid("90");
    setGiftSuccessMsg("");
    setGiftErrorMsg("");
    setIsGiftModalOpen(true);
  };

  const handleSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsGifting(true);
    setGiftSuccessMsg("");
    setGiftErrorMsg("");

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          welcomeText: giftWelcomeText,
          daysValid: parseInt(giftDaysValid) || 90,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setGiftSuccessMsg(`餐券发放成功！券码: ${data.coupon.code}`);
        setTimeout(() => {
          setIsGiftModalOpen(false);
          setSelectedUser(null);
        }, 1800);
      } else {
        setGiftErrorMsg(data.error || "发放失败，请重试");
      }
    } catch (err) {
      console.error("Gifting coupon failed:", err);
      setGiftErrorMsg("网络请求失败，请检查连接");
    } finally {
      setIsGifting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterBanned || user.isBanned;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="text-[#B8A099]">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">用户管理</h1>
        <div className="text-[#B8A099]">共 {users.length} 个用户</div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="搜索邮箱或名字..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#241918] border-[#2D1E1A] text-white"
        />
        <Button
          variant={filterBanned ? "default" : "outline"}
          onClick={() => setFilterBanned(!filterBanned)}
          className={filterBanned ? "bg-[#FF2442]" : ""}
        >
          {filterBanned ? "已禁用" : "全部"}
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-[#241918] border-[#2D1E1A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1311] border-b border-[#2D1E1A]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">
                  城市
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">
                  活动
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#B8A099]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D1E1A]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#1A1311]/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-[#B8A099] text-sm">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#B8A099]">{user.city}</td>
                  <td className="px-6 py-4 text-[#B8A099]">
                    创建: {user._count.eventsCreated} | 参加:{" "}
                    {user._count.eventAttendances}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.isBanned && (
                        <span className="px-2 py-1 bg-red-500/20 text-[#FF2442] text-xs rounded">
                          已禁用
                        </span>
                      )}
                      {!user.isActive && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-[#FF6B35] text-xs rounded">
                          非活跃
                        </span>
                      )}
                      {user.role === "ADMIN" && (
                        <span className="px-2 py-1 bg-[#FF4D94]/20 text-[#FF4D94] text-xs rounded">
                          管理员
                        </span>
                      )}
                      {user.canCreateEvents && (
                        <span className="px-2 py-1 bg-[#FF6B35]/20 text-[#FF6B35] text-xs rounded">
                          可创建活动
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEventCreation(user.id, user.canCreateEvents)}
                        className={
                          user.canCreateEvents
                            ? "text-[#FF6B35] hover:text-yellow-300"
                            : "text-[#FF2442] hover:text-[#FF4D63]"
                        }
                      >
                        {user.canCreateEvents ? "撤销活动权限" : "授予活动权限"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenGiftModal(user)}
                        className="text-[#FF4D94] hover:text-[#FF75B5] hover:bg-[#FF4D94]/10 transition-colors"
                      >
                        赠送餐券
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBanUser(user.id, user.isBanned)}
                        className={
                          user.isBanned
                            ? "text-[#FF6B35] hover:text-[#FF8C69]"
                            : "text-[#FF2442] hover:text-[#FF4D63]"
                        }
                      >
                        {user.isBanned ? "解禁" : "禁用"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 赠送餐券对话框 */}
      <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
        <DialogContent className="bg-[#241918] border-[#2D1E1A] text-white max-w-md sm:max-w-lg overflow-hidden p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <span className="inline-block p-1.5 rounded-lg bg-[#FF4D94]/15 text-[#FF4D94] text-base">
                🎫
              </span>
              赠送免费餐券
            </DialogTitle>
            <DialogDescription className="text-[#B8A099] text-sm">
              为指定用户手动发放一张特定免费晚餐券。
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleSendGift} className="space-y-5 mt-4">
              {/* 用户基础信息卡片 */}
              <div className="bg-[#1A1311]/70 rounded-xl p-3.5 border border-[#2D1E1A] flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{selectedUser.name}</p>
                  <p className="text-[#B8A099] text-xs mt-0.5">{selectedUser.email}</p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#241918] border border-[#2D1E1A] text-[#B8A099]">
                  {selectedUser.city || "未知城市"}
                </span>
              </div>

              {/* 有效天数 */}
              <div className="space-y-2.5">
                <Label htmlFor="daysValid" className="text-sm font-semibold text-[#B8A099]">
                  有效期限
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 90, 180, 365].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setGiftDaysValid(days.toString())}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                        giftDaysValid === days.toString()
                          ? "bg-[#FF2442] text-white border-transparent shadow-[0_0_12px_rgba(255,36,66,0.3)]"
                          : "bg-[#1A1311] text-[#B8A099] border-[#2D1E1A] hover:bg-[#1A1311]/80 hover:text-white"
                      }`}
                    >
                      {days} 天
                    </button>
                  ))}
                </div>
                <div className="mt-2.5">
                  <Input
                    id="daysValid"
                    type="number"
                    min="1"
                    max="999"
                    required
                    value={giftDaysValid}
                    onChange={(e) => setGiftDaysValid(e.target.value)}
                    placeholder="自定义有效天数"
                    className="bg-[#1A1311] border-[#2D1E1A] text-white placeholder-[#5A4540] text-sm focus-visible:border-[#FF2442] focus-visible:ring-[#FF2442]/30"
                  />
                </div>
              </div>

              {/* 欢迎留言 */}
              <div className="space-y-2">
                <Label htmlFor="welcomeText" className="text-sm font-semibold text-[#B8A099]">
                  专属欢迎留言
                </Label>
                <Textarea
                  id="welcomeText"
                  required
                  rows={3}
                  value={giftWelcomeText}
                  onChange={(e) => setGiftWelcomeText(e.target.value)}
                  placeholder="请输入赠券的欢迎留言..."
                  className="bg-[#1A1311] border-[#2D1E1A] text-white placeholder-[#5A4540] text-sm focus-visible:border-[#FF2442] focus-visible:ring-[#FF2442]/30 min-h-[90px]"
                />
                <p className="text-[11px] text-[#8C7671] leading-relaxed">
                  💡 欢迎词中会自动加上 <code className="text-[#FF4D94] font-semibold bg-[#FF4D94]/10 px-1 py-0.5 rounded">[专属赠券]</code> 前缀，前端页面会对该类型餐券渲染优雅高贵的奢华紫色视觉，使其与众不同。
                </p>
              </div>

              {/* 反馈状态提示 */}
              {giftSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <span>✨</span> {giftSuccessMsg}
                </div>
              )}
              {giftErrorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-[#FF2442] text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <span>⚠️</span> {giftErrorMsg}
                </div>
              )}

              {/* 操作按钮 */}
              <DialogFooter className="border-t border-[#2D1E1A] pt-4.5 -mx-6 -mb-6 px-6 bg-[#1C1211] gap-2 flex flex-col-reverse sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsGiftModalOpen(false);
                    setSelectedUser(null);
                  }}
                  disabled={isGifting}
                  className="text-[#B8A099] hover:text-white hover:bg-white/5 font-medium border border-transparent hover:border-white/10"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={isGifting || !giftWelcomeText || !giftDaysValid}
                  className="bg-gradient-to-r from-[#FF2442] to-[#FF7A59] hover:from-[#E61F3B] hover:to-[#EB6F4F] text-white font-semibold transition-all duration-200 shadow-[0_4px_16px_rgba(255,36,66,0.25)] hover:shadow-[0_4px_20px_rgba(255,36,66,0.35)] disabled:opacity-50"
                >
                  {isGifting ? "发放中..." : "确认发放餐券"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
