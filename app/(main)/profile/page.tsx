"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { signOutAction } from "@/app/actions/auth";
import Link from "next/link";
import { LogOut, Pencil, Sparkles, Check, Copy, Share2, Users, Ticket, Calendar, Gift } from "lucide-react";

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

interface Coupon {
  id: string;
  code: string;
  welcomeText: string;
  isUsed: boolean;
  expiresAt: string;
  isExpired: boolean;
  reason: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "invites">("profile");
  
  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Invites & Coupons State
  const [inviteData, setInviteData] = useState<{
    code: string;
    usageCount: number;
    shareUrl: string;
  } | null>(null);
  const [couponsData, setCouponsData] = useState<{
    coupons: Coupon[];
    validCount: number;
  } | null>(null);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfileAndBenefits = async () => {
      try {
        const [profileRes, inviteRes, couponsRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/invite"),
          fetch("/api/coupons")
        ]);

        if (!profileRes.ok) {
          router.push("/login");
          return;
        }
        
        const profileData = await profileRes.json();
        if (!isMounted) return;
        setProfile(profileData.user);
        setFormData(profileData.user);

        if (inviteRes.ok) {
          const invData = await inviteRes.json();
          setInviteData(invData.inviteCode);
        }

        if (couponsRes.ok) {
          const coupData = await couponsRes.json();
          setCouponsData(coupData);
        }
      } catch (err) {
        console.error("获取个人资料或福利失败:", err);
        if (isMounted) {
          setError("获取个人资料失败");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProfileAndBenefits();

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
      {/* Header Panel */}
      <div className="mb-8 flex items-center justify-between rounded-lg border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(80,35,30,0.07)] backdrop-blur-xl">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-semibold text-[#ff2442]">
            <Sparkles className="h-3.5 w-3.5" />
            {activeTab === "profile" ? "Profile" : "Benefits"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#271f1d]">
            {activeTab === "profile" ? "我的资料" : "邀请与福利"}
          </h1>
        </div>
        {activeTab === "profile" && (
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
        )}
      </div>

      {/* Modern Tabs Switcher */}
      <div className="mb-6 flex rounded-full border border-[#f0dfda] bg-[#fff7f5]/85 p-1 max-w-[280px] sm:max-w-xs shadow-sm">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === "profile"
              ? "bg-[#ff2442] text-white shadow-sm"
              : "text-[#8f7772] hover:bg-white hover:text-[#ff2442]"
          }`}
        >
          个人资料
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
            activeTab === "invites"
              ? "bg-[#ff2442] text-white shadow-sm"
              : "text-[#8f7772] hover:bg-white hover:text-[#ff2442]"
          }`}
        >
          邀请与餐券
          {couponsData && couponsData.validCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#ff2442] text-[9px] font-bold text-white ring-2 ring-white animate-bounce">
              {couponsData.validCount}
            </span>
          )}
        </button>
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

      {activeTab === "profile" ? (
        /* Tab 1: Profile Details Form */
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
                className="w-full rounded-lg border border-[#eadbd6] bg-white/90 px-3 py-2 text-sm"
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
                className="w-full rounded-lg border border-[#eadbd6] bg-white/90 px-3 py-2 text-sm"
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
      ) : (
        /* Tab 2: Referrals and Coupon Wallet */
        <div className="space-y-6">
          {/* Main Referral Program card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff2442] via-[#ff4d63] to-[#ff7a59] p-6 text-white shadow-[0_20px_50px_rgba(255,36,66,0.18)] sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md w-fit">
                <Gift className="h-3.5 w-3.5 animate-pulse" />
                推荐有礼 · 盲盒晚餐
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">邀请好友，共享晚餐</h2>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/90 max-w-xl">
                每成功邀请一位新朋友注册饭否，你和Ta均可**各获得一张免费餐券**（单张价值 129 元），无门槛参加周四晚 20:00 的心仪盲盒聚餐！
              </p>

              {inviteData ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
                  {/* Invite Code Box */}
                  <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-md flex flex-col justify-between">
                    <div className="text-[10px] text-white/70 font-bold tracking-wider uppercase">我的专属邀请码</div>
                    <div className="my-3.5 flex items-center justify-center gap-1">
                      {inviteData.code.split("").map((char, index) => (
                        <span
                          key={index}
                          className="flex h-9 w-7.5 items-center justify-center rounded-md bg-white text-sm font-bold text-[#ff2442] shadow-sm font-mono"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                    <Button
                      onClick={() => {
                        void navigator.clipboard.writeText(inviteData.code);
                        setCopyCodeSuccess(true);
                        setTimeout(() => setCopyCodeSuccess(false), 2000);
                      }}
                      variant="ghost"
                      className="h-8.5 w-full rounded-lg bg-white/15 text-[11px] font-bold text-white hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      {copyCodeSuccess ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-300 animate-scale-up" />
                          邀请码已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          复制邀请码
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Share Link Box */}
                  <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-md flex flex-col justify-between">
                    <div className="text-[10px] text-white/70 font-bold tracking-wider uppercase">我的专属分享链接</div>
                    <div className="my-2.5 break-all rounded-lg bg-black/15 px-3 py-2 text-[11px] font-mono text-white/90 select-all border border-black/10">
                      {inviteData.shareUrl}
                    </div>
                    <Button
                      onClick={() => {
                        void navigator.clipboard.writeText(inviteData.shareUrl);
                        setCopyLinkSuccess(true);
                        setTimeout(() => setCopyLinkSuccess(false), 2000);
                      }}
                      variant="ghost"
                      className="h-8.5 w-full rounded-lg bg-white text-[11px] font-bold text-[#ff2442] hover:bg-white/95 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {copyLinkSuccess ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600 animate-scale-up" />
                          邀请链接已复制
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5" />
                          一键复制专属邀请链接
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center text-xs text-white/80">加载邀请数据中...</div>
              )}
            </div>
          </div>

          {/* Referral Statistics */}
          {inviteData && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4.5 shadow-sm backdrop-blur-md flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff2442]/10 text-[#ff2442]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#9d8580] tracking-wider uppercase">成功邀请好友</div>
                  <div className="mt-0.5 text-xl font-bold text-[#271f1d]">
                    {inviteData.usageCount} <span className="text-[11px] font-medium text-[#9d8580]">人</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/70 bg-white/80 p-4.5 shadow-sm backdrop-blur-md flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#9d8580] tracking-wider uppercase">已获免费餐券</div>
                  <div className="mt-0.5 text-xl font-bold text-[#271f1d]">
                    {couponsData?.coupons.length || 0} <span className="text-[11px] font-medium text-[#9d8580]">张</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coupon Voucher Card Wallet List */}
          <div className="pt-2">
            <h3 className="mb-4 text-base sm:text-lg font-bold text-[#271f1d] flex items-center gap-2">
              <Ticket className="h-5 w-5 text-[#ff2442]" />
              我的餐券 {couponsData && couponsData.coupons.length > 0 && `(${couponsData.coupons.length})`}
            </h3>

            {!couponsData || couponsData.coupons.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#eadbd6] bg-white/40 p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2442]/5 text-[#ff2442]/40">
                  <Ticket className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-[#8f7772]">暂无活动餐券</p>
                <p className="mt-1 text-xs text-[#b8a09b] max-w-sm mx-auto leading-relaxed">
                  分享您的邀请码给未注册的朋友，当Ta通过您的链接成功加入饭否，免费晚餐券将自动发放到这里！
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {couponsData.coupons.map((coupon) => {
                  const isUnused = !coupon.isUsed && !coupon.isExpired;
                  const formattedDate = new Date(coupon.expiresAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                  const isCopied = copiedCouponId === coupon.id;

                  return (
                    <div
                      key={coupon.id}
                      className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                        isUnused
                          ? "border-[#ff2442]/20 bg-white shadow-sm hover:shadow-md"
                          : "border-[#eadbd6]/50 bg-[#fffcfc]/40 opacity-75"
                      }`}
                    >
                      {/* Ticket notches (simulates paper coupon punches) */}
                      <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-inherit bg-[#fff9f7] z-10" />

                      <div className="grid grid-cols-[1fr_auto] items-center p-4.5 sm:p-5.5 pl-6">
                        {/* Coupon Content Details */}
                        <div className="pr-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${
                                coupon.reason === "REGISTER"
                                  ? "bg-red-50 text-red-600 border border-red-100/60"
                                  : "bg-orange-50 text-orange-600 border border-orange-100/60"
                              }`}
                            >
                              {coupon.reason === "REGISTER" ? "新人礼券" : "裂变奖励"}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                isUnused
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : coupon.isUsed
                                  ? "bg-gray-100 text-gray-500 line-through"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {isUnused ? "待使用" : coupon.isUsed ? "已使用" : "已过期"}
                            </span>
                          </div>

                          <p className="mt-2.5 text-xs sm:text-sm font-semibold leading-relaxed text-[#271f1d]">
                            {coupon.welcomeText}
                          </p>

                          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#9d8580]">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>有效期至：{formattedDate}</span>
                          </div>
                        </div>

                        {/* Dashed Separator Area & Code */}
                        <div className="relative pl-5 sm:pl-6 border-l border-dashed border-[#eadbd6] flex flex-col items-center justify-center min-w-[100px] sm:min-w-[125px]">
                          {/* Right Notch */}
                          <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-inherit bg-[#fff9f7] z-10" />
                          
                          <div className="text-[9px] font-bold text-[#b8a09b] uppercase tracking-wider mb-1">餐券券码</div>
                          <div className={`font-mono text-xs sm:text-sm font-bold tracking-tight ${isUnused ? "text-[#ff2442]" : "text-[#9d8580]"}`}>
                            {coupon.code}
                          </div>

                          {isUnused && (
                            <Button
                              onClick={() => {
                                void navigator.clipboard.writeText(coupon.code);
                                setCopiedCouponId(coupon.id);
                                setTimeout(() => setCopiedCouponId(null), 2000);
                              }}
                              variant="ghost"
                              className="mt-2 h-6.5 rounded-md bg-[#fff0ef] hover:bg-[#ff2442] hover:text-white text-[10px] font-bold text-[#ff2442] px-2.5 active:scale-95 transition-all flex items-center gap-1"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3 w-3 animate-scale-up" />
                                  已复制
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  复制券码
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub Footer Options */}
      <div className="mt-8 space-y-3">
        <Link href="/onboarding?edit=true">
          <Button variant="outline" className="w-full rounded-lg border-[#eadbd6] bg-white/80 text-xs sm:text-sm">
            重新完成问卷
          </Button>
        </Link>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full rounded-lg border-red-100 bg-white/80 text-[#ff2442] hover:text-red-700 text-xs sm:text-sm">
            <LogOut className="mr-1.5 h-4 w-4" />
            退出登录
          </Button>
        </form>
      </div>
    </div>
  );
}

