"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, Copy, QrCode, ClipboardList, Wallet, Sparkles } from "lucide-react";

type AttendanceStatus = "CONFIRMED" | "PENDING" | "WAITLISTED" | null;

interface AttendButtonProps {
  eventId: string;
  initialIsAttending: boolean;
  initialStatus: AttendanceStatus;
  isFull: boolean;
  priceAmount: number;
  initialOrderCode?: string | null;
}

function MockQRCode({ type }: { type: "wechat" | "alipay" }) {
  const isWeChat = type === "wechat";
  const color = isWeChat ? "#07C160" : "#1677FF";

  return (
    <div className="relative flex flex-col items-center p-5 bg-white border border-[#F0E4E0] rounded-3xl shadow-xs transition-transform duration-300 hover:scale-[1.02]">
      <svg className="w-40 h-40" viewBox="0 0 100 100">
        <rect x="5" y="5" width="20" height="20" fill="none" stroke={color} strokeWidth="3" />
        <rect x="10" y="10" width="10" height="10" fill={color} />

        <rect x="75" y="5" width="20" height="20" fill="none" stroke={color} strokeWidth="3" />
        <rect x="80" y="10" width="10" height="10" fill={color} />

        <rect x="5" y="75" width="20" height="20" fill="none" stroke={color} strokeWidth="3" />
        <rect x="10" y="80" width="10" height="10" fill={color} />

        <path d="M 35,10 H 45 V 20 H 35 Z M 50,15 H 60 V 25 H 50 Z M 65,10 H 70 V 30 H 65 Z" fill={color} />
        <path d="M 10,35 H 25 V 45 H 10 Z M 30,30 H 40 V 50 H 30 Z M 45,35 H 55 V 40 H 45 Z" fill={color} />
        <path d="M 15,55 H 20 V 65 H 15 Z M 35,55 H 45 V 60 H 35 Z M 50,45 H 65 V 50 H 50 Z" fill={color} />
        <path d="M 55,55 H 70 V 65 H 55 Z M 75,35 H 85 V 45 H 75 Z M 80,50 H 90 V 60 H 80 Z" fill={color} />
        <path d="M 30,65 H 40 V 75 H 30 Z M 45,65 H 50 V 90 H 45 Z M 55,75 H 65 V 85 H 55 Z" fill={color} />
        <path d="M 65,70 H 70 V 75 H 65 Z M 75,65 H 80 V 70 H 75 Z M 80,75 H 90 V 90 H 80 Z" fill={color} />

        <circle cx="50" cy="50" r="14" fill="white" stroke={color} strokeWidth="1.5" />
      </svg>
      <span className="absolute top-[43%] text-[9px] font-bold tracking-tight" style={{ color }}>
        {isWeChat ? "微信支付" : "支付宝"}
      </span>
      <span className="mt-3 text-xs font-semibold text-[#2D2420] opacity-80">
        扫一扫转账保证金
      </span>
    </div>
  );
}

export function AttendButton({
  eventId,
  initialIsAttending,
  initialStatus,
  isFull,
  priceAmount,
  initialOrderCode = null,
}: AttendButtonProps) {
  const [isAttending, setIsAttending] = useState(initialIsAttending);
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(initialOrderCode);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeQR, setActiveQR] = useState<'wechat' | 'alipay'>('wechat');

  const handleCopyCode = () => {
    if (!orderCode) return;
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        setOrderCode(null);
        window.location.reload();
      } else {
        // Join flow
        if (priceAmount > 0) {
          // Paid event: call reserve API to generate Reservation Order Code
          const res = await fetch(`/api/events/${eventId}/reserve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();

          if (!res.ok) {
            alert(data.error || "生成预订订单失败");
            return;
          }

          if (data.order) {
            setOrderCode(data.order.orderCode);
            setIsAttending(true);
            setStatus("PENDING");
            setIsPayDialogOpen(true);
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

  return (
    <>
      <div className="flex flex-col gap-3 w-full sm:w-auto">
        <div className="flex gap-3">
          {!isAttending ? (
            isFull ? (
              <Button
                onClick={handleToggle}
                disabled={loading}
                variant="outline"
                className="rounded-full px-6 border-[#F0E4E0] hover:bg-[#FFF5F3] text-[#B8A099] font-medium"
              >
                {loading ? "处理中..." : "加入候补"}
              </Button>
            ) : priceAmount > 0 ? (
              <Button
                onClick={handleToggle}
                disabled={loading}
                className="rounded-full px-6 bg-[#FF2442] hover:bg-[#FF4D63] text-white font-medium shadow-sm transition-transform hover:scale-[1.01]"
              >
                {loading ? "处理中..." : `报名活动（保证金 ￥${priceAmount}）`}
              </Button>
            ) : (
              <Button
                onClick={handleToggle}
                disabled={loading}
                className="rounded-full px-6 bg-[#FF2442] hover:bg-[#FF4D63] text-white font-medium shadow-sm transition-transform hover:scale-[1.01]"
              >
                {loading ? "处理中..." : "加入活动"}
              </Button>
            )
          ) : (
            <div className="flex gap-3 items-center w-full">
              {status === "PENDING" && (
                <Button
                  onClick={() => setIsPayDialogOpen(true)}
                  className="rounded-full px-6 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  查看付款二维码
                </Button>
              )}

              <Button
                onClick={handleToggle}
                disabled={loading}
                variant={status === "CONFIRMED" ? "destructive" : "outline"}
                className="rounded-full px-6 font-medium"
              >
                {loading ? "处理中..." : status === "CONFIRMED" ? "退出活动" : status === "WAITLISTED" ? "已候补 · 退出" : "取消申请"}
              </Button>
            </div>
          )}
        </div>

        {/* Persistent Payment status alert banner when PENDING */}
        {isAttending && status === "PENDING" && orderCode && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[13px] leading-relaxed max-w-md shadow-2xs">
            <div className="flex items-center gap-2 font-semibold mb-1 text-amber-900">
              <ClipboardList className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>待核对付款信息</span>
            </div>
            <p className="mb-2 opacity-95">
              您已成功提交报名申请！请扫码支付保证金 <strong>￥{priceAmount}</strong> 并备注专属备注码：
            </p>
            <div className="flex items-center gap-2 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-200/50 w-fit font-mono text-base font-bold text-amber-900 mb-2">
              <span>{orderCode}</span>
              <button onClick={handleCopyCode} className="hover:text-amber-700 p-0.5" title="复制备注码">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[12px] opacity-75 leading-tight">
              * 管理员将在核对微信/支付宝转账附言中的备注码后，为您解锁完整活动席位。如有疑问，可联系客服。
            </p>
          </div>
        )}
      </div>

      {/* Manual Payment Dialog Modal */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-sm rounded-3xl bg-[#FFFAF8] border-0 p-6 shadow-2xl ring-0">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-[#2D2420] flex items-center justify-center gap-2">
              <Wallet className="w-5 h-5 text-[#FF2442]" />
              完成保证金支付
            </DialogTitle>
            <DialogDescription className="text-xs text-[#B8A099] mt-1">
              Participants pay for their own meals at the restaurant.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 mt-4">
            {/* Pay Info Banner */}
            <div className="w-full bg-white p-4 border border-[#F0E4E0] rounded-2xl text-center shadow-2xs">
              <span className="text-xs text-[#B8A099]">保证金金额</span>
              <div className="text-3xl font-extrabold text-[#2D2420] mt-0.5">￥{priceAmount}</div>
              <div className="text-[11px] text-[#B8A099] mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                防止临时取消，履约后可全额退还
              </div>
            </div>

            {/* WeChat/Alipay QR Code Selector */}
            <div className="flex justify-center bg-[#FFF5F3] p-1 rounded-full w-full">
              <button
                onClick={() => setActiveQR('wechat')}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${activeQR === 'wechat' ? 'bg-[#07C160] text-white' : 'text-[#B8A099] hover:text-[#2D2420]'}`}
              >
                微信支付
              </button>
              <button
                onClick={() => setActiveQR('alipay')}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${activeQR === 'alipay' ? 'bg-[#1677FF] text-white' : 'text-[#B8A099] hover:text-[#2D2420]'}`}
              >
                支付宝支付
              </button>
            </div>

            {/* QR code display */}
            <div className="flex justify-center w-full min-h-[220px]">
              <MockQRCode type={activeQR} />
            </div>

            {/* Remark Code Display Box */}
            <div className="w-full bg-[#FFF0F3] border border-[#FF2442]/10 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-xs text-[#FF2442] font-semibold flex items-center gap-1.5 mb-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                转账时务必填写备注码
              </span>
              <div className="flex items-center gap-3 bg-white px-4 py-2 border border-[#FF2442]/10 rounded-xl font-mono text-lg font-extrabold text-[#FF2442] shadow-2xs">
                <span>{orderCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-[#FFFAF8] rounded-md transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#FF2442]" />
                  )}
                </button>
              </div>
              <span className="text-[11px] text-[#B8A099] text-center mt-2 leading-normal">
                为了匹配您的报名申请，请将上方的四位字符（含字母）填写至转账的<strong>「留言/附言/备注」</strong>中。
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => {
                setIsPayDialogOpen(false);
                window.location.reload();
              }}
              className="w-full rounded-full bg-[#FF2442] hover:bg-[#FF4D63] text-white font-semibold py-2.5"
            >
              我已扫码支付，等待确认
            </Button>
            <Button
              onClick={() => setIsPayDialogOpen(false)}
              variant="ghost"
              className="w-full rounded-full text-[#B8A099] hover:text-[#2D2420]"
            >
              稍后支付
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
