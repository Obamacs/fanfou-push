"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, XCircle, Loader2, ClipboardCheck } from "lucide-react";

interface Attendee {
  userId: string;
  user: {
    name: string;
    avatarUrl: string | null;
    gender: string | null;
    ageGroup: string | null;
  };
}

interface Order {
  userId: string;
  refundStatus: string;
}

interface ManageAttendanceProps {
  eventId: string;
  attendees: Attendee[];
  orders: Order[];
}

export function ManageAttendance({ eventId, attendees, orders }: ManageAttendanceProps) {
  const { toast } = useToast();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);

  const handleMarkAttendance = async (userId: string, action: "ATTEND" | "NO_SHOW") => {
    setLoadingUserId(userId);
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "标记成功！");
        // Update local state to reflect UI change instantly
        setLocalOrders(prev => prev.map(o => 
          o.userId === userId 
            ? { ...o, refundStatus: action === "ATTEND" ? "ELIGIBLE" : "FORFEITED" } 
            : o
        ));
      } else {
        toast.error(data.error || "标记失败");
      }
    } catch (err) {
      console.error(err);
      toast.error("网络请求失败，请重试");
    } finally {
      setLoadingUserId(null);
    }
  };

  if (attendees.length === 0) return null;

  return (
    <div className="mb-8 mt-8 border-t border-[#F0E4E0] pt-8">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-6 h-6 text-[#FF2442]" />
        <h2 className="text-[20px] font-bold text-[#2D2420]">出席核销管理 (仅管理员可见)</h2>
      </div>
      <p className="text-sm text-[#B8A099] mb-4">
        活动开始后，请在此处核实用户的出席情况。标记为“已到场”的用户，其押金将自动进入待退款池。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attendees.map((att) => {
          const order = localOrders.find(o => o.userId === att.userId);
          const refundStatus = order?.refundStatus || "NOT_ELIGIBLE";
          
          return (
            <Card key={att.userId} className="p-3 bg-white border border-[#F0E4E0] rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF5F3] text-[#FF2442] flex items-center justify-center font-bold">
                  {att.user.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold text-[#2D2420] truncate text-sm">{att.user.name}</div>
                  <div className="text-[11px] text-[#B8A099]">
                    {att.user.gender === "MALE" ? "男" : att.user.gender === "FEMALE" ? "女" : "未知"} 
                    {att.user.ageGroup && ` · ${att.user.ageGroup}`}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {refundStatus === "ELIGIBLE" || refundStatus === "REFUNDED" ? (
                  <div className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已确认出席 (待退款)
                  </div>
                ) : refundStatus === "FORFEITED" ? (
                  <div className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-semibold border border-red-100">
                    <XCircle className="w-3.5 h-3.5" />
                    已标记爽约 (没收押金)
                  </div>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={loadingUserId === att.userId}
                      onClick={() => handleMarkAttendance(att.userId, "ATTEND")}
                      className="flex-1 h-8 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {loadingUserId === att.userId ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                      已到场
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={loadingUserId === att.userId}
                      onClick={() => handleMarkAttendance(att.userId, "NO_SHOW")}
                      className="flex-1 h-8 text-xs border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      {loadingUserId === att.userId ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      放鸽子
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
