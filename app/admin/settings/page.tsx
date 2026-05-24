"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Loader2, Sparkles, QrCode } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    minUsersForMatch: 3,
    maxMatchGroupSize: 6,
    matchExpirationHours: 24,
    eventCreationBanDuration: 30,
    wechatQRCodeUrl: "",
    alipayQRCodeUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings({
              minUsersForMatch: data.settings.minUsersForMatch ?? 3,
              maxMatchGroupSize: data.settings.maxMatchGroupSize ?? 6,
              matchExpirationHours: data.settings.matchExpirationHours ?? 24,
              eventCreationBanDuration: data.settings.eventCreationBanDuration ?? 30,
              wechatQRCodeUrl: data.settings.wechatQRCodeUrl ?? "",
              alipayQRCodeUrl: data.settings.alipayQRCodeUrl ?? "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert("设置已保存");
      } else {
        const errData = await res.json();
        alert(errData.error || "保存失败");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF2442] mb-4" />
        <p className="text-[#B8A099] text-sm">正在加载系统配置...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-[#FF2442]" />
          系统设置
        </h1>
        <p className="text-sm text-[#B8A099] mt-1.5">
          配置全站核心业务逻辑、匹配规则，以及支付扫码收款码。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Parameters */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-[#241918] border-[#2D1E1A] p-8 rounded-3xl shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-[#FF2442]" />
              匹配算法与防放鸽子机制
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#B8A099] mb-2">
                  最少匹配人数
                </label>
                <Input
                  type="number"
                  min="2"
                  max="20"
                  value={settings.minUsersForMatch}
                  onChange={(e) =>
                    handleChange("minUsersForMatch", parseInt(e.target.value) || 3)
                  }
                  className="bg-[#1A1311] border-[#2D1E1A] text-white rounded-xl focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442]"
                />
                <p className="text-xs text-[#6B5A55] mt-1.5">
                  生成盲盒饭友匹配时，每个餐桌所需要的最少候选人数。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8A099] mb-2">
                  最大匹配组大小
                </label>
                <Input
                  type="number"
                  min="3"
                  max="20"
                  value={settings.maxMatchGroupSize}
                  onChange={(e) =>
                    handleChange("maxMatchGroupSize", parseInt(e.target.value) || 6)
                  }
                  className="bg-[#1A1311] border-[#2D1E1A] text-white rounded-xl focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442]"
                />
                <p className="text-xs text-[#6B5A55] mt-1.5">
                  单桌就餐的最大饭友人数。推荐值为 6 人。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8A099] mb-2">
                  匹配确认过期时间（小时）
                </label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.matchExpirationHours}
                  onChange={(e) =>
                    handleChange("matchExpirationHours", parseInt(e.target.value) || 24)
                  }
                  className="bg-[#1A1311] border-[#2D1E1A] text-white rounded-xl focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442]"
                />
                <p className="text-xs text-[#6B5A55] mt-1.5">
                  匹配成功通知发出后，用户需要多少小时内完成确认支付。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8A099] mb-2">
                  放鸽子封禁惩罚时长（天）
                </label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.eventCreationBanDuration}
                  onChange={(e) =>
                    handleChange(
                      "eventCreationBanDuration",
                      parseInt(e.target.value) || 30
                    )
                  }
                  className="bg-[#1A1311] border-[#2D1E1A] text-white rounded-xl focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442]"
                />
                <p className="text-xs text-[#6B5A55] mt-1.5">
                  对于确认就餐后无故缺席（放鸽子）的用户，自动禁止报名的天数。
                </p>
              </div>
            </div>
          </Card>

          {/* QR Code Upload Settings */}
          <Card className="bg-[#241918] border-[#2D1E1A] p-8 rounded-3xl shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#FF2442]" />
              支付收款二维码配置
            </h2>
            <p className="text-xs text-[#B8A099] leading-relaxed">
              用户报名周四晚餐活动时，系统将分别要求支付平台组织费和出席保证金。请上传您在微信/支付宝生成的<strong>「个人收款码（需带对账备注引导）」</strong>或<strong>「商家收款码」</strong>图片。如果未上传或上传失败，系统将自动回退到优雅的 SVG 占位图。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* WeChat QR Code */}
              <div className="bg-[#1A1311] border border-[#2D1E1A] p-6 rounded-2xl flex flex-col items-center space-y-4">
                <span className="text-sm font-semibold text-[#07C160]">微信收款二维码</span>
                <ImageUpload
                  value={settings.wechatQRCodeUrl}
                  onChange={(url) => handleChange("wechatQRCodeUrl", url)}
                  label="点击或拖拽上传微信收款码"
                  type="event"
                  aspect="square"
                />
                <span className="text-[11px] text-[#6B5A55] text-center">
                  建议上传正方形、高清晰度的微信个人收钱码图片
                </span>
              </div>

              {/* Alipay QR Code */}
              <div className="bg-[#1A1311] border border-[#2D1E1A] p-6 rounded-2xl flex flex-col items-center space-y-4">
                <span className="text-sm font-semibold text-[#1677FF]">支付宝收款二维码</span>
                <ImageUpload
                  value={settings.alipayQRCodeUrl}
                  onChange={(url) => handleChange("alipayQRCodeUrl", url)}
                  label="点击或拖拽上传支付宝收款码"
                  type="event"
                  aspect="square"
                />
                <span className="text-[11px] text-[#6B5A55] text-center">
                  建议上传正方形、高清晰度的支付宝个人收钱码图片
                </span>
              </div>
            </div>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#FF2442] hover:bg-[#FF4D63] text-white font-semibold py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-1" />
                正在保存系统配置...
              </>
            ) : (
              "保存设置"
            )}
          </Button>
        </div>

        {/* Right column: Quick info */}
        <div className="space-y-8">
          <Card className="bg-[#241918] border-[#2D1E1A] p-6 rounded-3xl shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">服务器状态</h2>
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-[#2D1E1A]">
                <span className="text-[#B8A099]">Node.js 版本</span>
                <span className="font-semibold text-white font-mono">{process.version}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#2D1E1A]">
                <span className="text-[#B8A099]">环境模式</span>
                <span className="font-semibold text-white capitalize">{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#B8A099]">运行平台</span>
                <span className="font-semibold text-white capitalize">{process.platform}</span>
              </div>
            </div>
          </Card>

          <Card className="bg-[#241918] border-[#2D1E1A] p-6 rounded-3xl shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">快速操作</h2>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full rounded-xl text-[#FF2442] border-[#4D2426] bg-[#2A1718] hover:bg-[#3D1E20] hover:text-white"
                disabled
              >
                清理过期数据
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl text-[#FF6B35] border-[#4D3A24] bg-[#2A2017] hover:bg-[#3D2C1E] hover:text-white"
                disabled
              >
                发送系统通知
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
