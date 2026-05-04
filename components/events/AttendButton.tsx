"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

type AttendanceStatus = "CONFIRMED" | "PENDING" | "WAITLISTED" | null;

interface AttendButtonProps {
  eventId: string;
  initialIsAttending: boolean;
  initialStatus: AttendanceStatus;
  isFull: boolean;
  priceAmount: number;
}

export function AttendButton({
  eventId,
  initialIsAttending,
  initialStatus,
  isFull,
  priceAmount,
}: AttendButtonProps) {
  const [isAttending, setIsAttending] = useState(initialIsAttending);
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);

    try {
      if (isAttending) {
        // Leave flow
        const action = "leave";
        const res = await fetch(`/api/events/${eventId}/attend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "操作失败");
          return;
        }

        setIsAttending(false);
        setStatus(null);
        window.location.reload();
      } else {
        // Join flow
        if (priceAmount > 0) {
          // Paid event: redirect to Stripe checkout
          const res = await fetch(`/api/stripe/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId }),
          });

          const data = await res.json();

          if (!res.ok) {
            alert(data.error || "创建支付会话失败");
            return;
          }

          if (data.url) {
            window.location.href = data.url;
          }
        } else {
          // Free event: direct join
          const action = "join";
          const res = await fetch(`/api/events/${eventId}/attend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });

          const data = await res.json();

          if (!res.ok) {
            alert(data.error || "操作失败");
            return;
          }

          setIsAttending(true);
          setStatus(data.attendance.status as AttendanceStatus);
          window.location.reload();
        }
      }
    } catch (error) {
      alert("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!isAttending) {
    if (isFull) {
      return (
        <Button
          onClick={handleToggle}
          disabled={loading}
          variant="outline"
        >
          {loading ? "处理中..." : "加入候补"}
        </Button>
      );
    }

    if (priceAmount > 0) {
      return (
        <Button
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? "处理中..." : "报名活动（需支付）"}
        </Button>
      );
    }

    return (
      <Button
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? "处理中..." : "加入活动"}
      </Button>
    );
  }

  // Attending
  const buttonText = (() => {
    switch (status) {
      case "CONFIRMED":
        return "退出活动";
      case "WAITLISTED":
        return "已候补 · 退出";
      case "PENDING":
        return "待付款 · 退出";
      default:
        return "退出活动";
    }
  })();

  const isDestructive = status === "CONFIRMED";

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      variant={isDestructive ? "destructive" : "ghost"}
    >
      {loading ? "处理中..." : buttonText}
    </Button>
  );
}
