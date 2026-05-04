"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface OtherUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${userId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "获取消息失败");
        return;
      }

      setOtherUser(data.otherUser);
      setMessages(data.messages);
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim()) {
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: userId,
          content: messageInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "发送失败");
        return;
      }

      setMessageInput("");
      setMessages([...messages, data.message]);
      scrollToBottom();
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">用户不存在</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4 flex items-center gap-3">
        <Link href="/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          {otherUser.avatarUrl ? (
            <img
              src={otherUser.avatarUrl}
              alt={otherUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
              {otherUser.name.charAt(0)}
            </div>
          )}
          <h1 className="text-lg font-semibold">{otherUser.name}</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">暂无消息，开始聊天吧</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === userId ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === userId
                    ? "bg-white border border-gray-200"
                    : "bg-blue-500 text-white"
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderId === userId
                      ? "text-gray-400"
                      : "text-blue-100"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t bg-white p-4">
        <div className="flex gap-2">
          <Input
            placeholder="输入消息..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={sending}
            autoFocus
          />
          <Button type="submit" disabled={sending || !messageInput.trim()}>
            {sending ? "发送中..." : "发送"}
          </Button>
        </div>
      </form>
    </div>
  );
}
