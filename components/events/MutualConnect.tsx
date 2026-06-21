"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Heart, X, Loader2, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Attendee {
  userId: string;
  user: {
    name: string;
    avatarUrl: string | null;
    gender: string | null;
    ageGroup: string | null;
  };
}

interface MutualConnectProps {
  eventId: string;
  attendees: Attendee[];
  currentUserId: string;
  initialRatings: Record<string, "YES" | "NO">;
}

export function MutualConnect({ eventId, attendees, currentUserId, initialRatings }: MutualConnectProps) {
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<string, "YES" | "NO">>(initialRatings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Match modal state
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedUser, setMatchedUser] = useState<Attendee | null>(null);

  const others = attendees.filter((a) => a.userId !== currentUserId);

  const handleConnect = async (targetUserId: string, action: "YES" | "NO") => {
    setLoadingId(targetUserId);
    try {
      const res = await fetch(`/api/events/${eventId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setRatings((prev) => ({ ...prev, [targetUserId]: action }));
        if (action === "YES" && data.matched) {
          const matchedTarget = others.find((u) => u.userId === targetUserId);
          if (matchedTarget) {
            setMatchedUser(matchedTarget);
            setMatchModalOpen(true);
          }
        } else if (action === "YES") {
          toast.success("已发送心动信号，等待对方回应！");
        }
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (err) {
      console.error(err);
      toast.error("网络错误，请重试");
    } finally {
      setLoadingId(null);
    }
  };

  if (others.length === 0) return null;

  return (
    <div className="mt-8 border-t border-[#F0E4E0] pt-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-6 h-6 text-[#FF2442]" />
        <h2 className="text-[20px] font-bold text-[#2D2420]">同桌心动连线</h2>
      </div>
      <p className="text-[14px] text-[#B8A099] mb-6">
        在刚刚的饭局中，对谁印象最深？如果你们互相点击了“心动”，即可解锁私信聊天哦！选择绝对私密。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {others.map((att) => {
          const currentRating = ratings[att.userId];
          const isPassed = currentRating === "NO";
          
          return (
            <Card 
              key={att.userId} 
              className={`p-4 border-[#F0E4E0] flex flex-col gap-4 transition-all duration-300 ${
                isPassed ? "opacity-40 grayscale" : "bg-white hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FFF5F3] text-[#FF2442] flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {att.user.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold text-[#2D2420] truncate">{att.user.name}</div>
                  <div className="text-[12px] text-[#B8A099] mt-0.5">
                    {att.user.gender === "MALE" ? "男生" : att.user.gender === "FEMALE" ? "女生" : "未知"} 
                    {att.user.ageGroup && ` · ${att.user.ageGroup}`}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {currentRating === "YES" ? (
                  <div className="flex-1 flex items-center justify-center py-2.5 bg-[#FFF5F3] text-[#FF2442] rounded-xl text-sm font-bold border border-[#FFE4DE]">
                    <Heart className="w-4 h-4 mr-1.5 fill-[#FF2442]" />
                    已心动
                  </div>
                ) : isPassed ? (
                  <div className="flex-1 flex items-center justify-center py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-bold border border-gray-200">
                    已忽略
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      disabled={loadingId === att.userId}
                      onClick={() => handleConnect(att.userId, "NO")}
                      className="flex-1 h-10 text-sm border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl"
                    >
                      {loadingId === att.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
                      无感
                    </Button>
                    <Button 
                      disabled={loadingId === att.userId}
                      onClick={() => handleConnect(att.userId, "YES")}
                      className="flex-1 h-10 text-sm bg-[#FF2442] hover:bg-[#FF4D63] text-white rounded-xl shadow-sm"
                    >
                      {loadingId === att.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 mr-1" />}
                      心动
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={matchModalOpen} onOpenChange={setMatchModalOpen}>
        <DialogContent className="bg-white border-[#F0E4E0] sm:max-w-md rounded-3xl text-center p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#FF2442] flex justify-center items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6" />
              双向奔赴成功！
              <Sparkles className="w-6 h-6" />
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#2D2420] text-center pt-2">
              太棒了！原来 <span className="font-bold">{matchedUser?.user.name}</span> 也对你心动了。
              系统已为您自动破冰，马上开始聊天吧！
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center gap-6 my-8">
            <div className="w-20 h-20 rounded-full bg-[#FFF5F3] text-[#FF2442] flex items-center justify-center font-bold text-3xl shadow-inner border-4 border-white z-10">
              我
            </div>
            <Heart className="w-8 h-8 fill-[#FF2442] text-[#FF2442] animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-[#FFF5F3] text-[#FF2442] flex items-center justify-center font-bold text-3xl shadow-inner border-4 border-white z-10">
              {matchedUser?.user.name.charAt(0)}
            </div>
          </div>

          <Link href={`/messages/${matchedUser?.userId}`}>
            <Button className="w-full h-12 rounded-full bg-[#FF2442] hover:bg-[#FF4D63] text-white font-bold text-[16px] shadow-md shadow-[#FF2442]/20">
              <MessageCircle className="w-5 h-5 mr-2" />
              去私信聊天
            </Button>
          </Link>
        </DialogContent>
      </Dialog>
    </div>
  );
}
