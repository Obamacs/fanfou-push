"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "获取对话列表失败");
        return;
      }

      setConversations(data.conversations);
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#B8A099]">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">消息</h1>
        <Input
          placeholder="搜索对话..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {filteredConversations.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[#B8A099] mb-4">
            {conversations.length === 0 ? "暂无对话" : "未找到匹配的对话"}
          </p>
          <Link href="/events">
            <Button variant="outline">浏览活动</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => (
            <Link key={conv.partnerId} href={`/messages/${conv.partnerId}`}>
              <Card className="p-4 hover:bg-[#FFF5F3] cursor-pointer transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {conv.partnerAvatar ? (
                      <img
                        src={conv.partnerAvatar}
                        alt={conv.partnerName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {conv.partnerName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#2D2420]">
                        {conv.partnerName}
                      </h3>
                      <p className="text-sm text-[#B8A099] truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-xs text-[#B8A099]">
                      {new Date(conv.lastMessageTime).toLocaleDateString()}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
