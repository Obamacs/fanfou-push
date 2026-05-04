"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterBanned || user.isBanned;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">用户管理</h1>
        <div className="text-gray-400">共 {users.length} 个用户</div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="搜索邮箱或名字..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-900 border-gray-800 text-white"
        />
        <Button
          variant={filterBanned ? "default" : "outline"}
          onClick={() => setFilterBanned(!filterBanned)}
          className={filterBanned ? "bg-red-600" : ""}
        >
          {filterBanned ? "已禁用" : "全部"}
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                  城市
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                  活动
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user.city}</td>
                  <td className="px-6 py-4 text-gray-300">
                    创建: {user._count.eventsCreated} | 参加:{" "}
                    {user._count.eventAttendances}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.isBanned && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                          已禁用
                        </span>
                      )}
                      {!user.isActive && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                          非活跃
                        </span>
                      )}
                      {user.role === "ADMIN" && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                          管理员
                        </span>
                      )}
                      {user.canCreateEvents && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
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
                            ? "text-yellow-400 hover:text-yellow-300"
                            : "text-blue-400 hover:text-blue-300"
                        }
                      >
                        {user.canCreateEvents ? "撤销活动权限" : "授予活动权限"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBanUser(user.id, user.isBanned)}
                        className={
                          user.isBanned
                            ? "text-green-400 hover:text-green-300"
                            : "text-red-400 hover:text-red-300"
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
    </div>
  );
}
