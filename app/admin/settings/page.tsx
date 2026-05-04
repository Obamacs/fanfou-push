"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    minUsersForMatch: 3,
    maxMatchGroupSize: 6,
    matchExpirationHours: 24,
    eventCreationBanDuration: 30,
  });
  const [saving, setSaving] = useState(false);

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
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">系统设置</h1>

      <Card className="bg-gray-900 border-gray-800 p-8">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">匹配算法配置</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最少匹配人数
              </label>
              <Input
                type="number"
                min="2"
                max="20"
                value={settings.minUsersForMatch}
                onChange={(e) =>
                  handleChange("minUsersForMatch", parseInt(e.target.value))
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                创建匹配时至少需要的候选人数
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最大匹配组大小
              </label>
              <Input
                type="number"
                min="3"
                max="20"
                value={settings.maxMatchGroupSize}
                onChange={(e) =>
                  handleChange("maxMatchGroupSize", parseInt(e.target.value))
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                一个匹配组最多包含的人数
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                匹配过期时间（小时）
              </label>
              <Input
                type="number"
                min="1"
                max="168"
                value={settings.matchExpirationHours}
                onChange={(e) =>
                  handleChange("matchExpirationHours", parseInt(e.target.value))
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                匹配多少小时后自动过期
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                创建事件禁用时长（天）
              </label>
              <Input
                type="number"
                min="1"
                max="365"
                value={settings.eventCreationBanDuration}
                onChange={(e) =>
                  handleChange(
                    "eventCreationBanDuration",
                    parseInt(e.target.value)
                  )
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                禁用用户创建事件的持续时长
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
          >
            {saving ? "保存中..." : "保存设置"}
          </Button>
        </div>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">服务器信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Node.js 版本</span>
              <span className="text-gray-300">{process.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">环境</span>
              <span className="text-gray-300">{process.env.NODE_ENV}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">运行平台</span>
              <span className="text-gray-300">{process.platform}</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">快速操作</h2>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full text-red-400 border-red-800 hover:bg-red-900/20"
              disabled
            >
              清理过期数据
            </Button>
            <Button
              variant="outline"
              className="w-full text-yellow-400 border-yellow-800 hover:bg-yellow-900/20"
              disabled
            >
              发送系统通知
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
