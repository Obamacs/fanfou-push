"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, Copy, QrCode, ClipboardList, Wallet, Sparkles } from "lucide-react";

type AttendanceStatus = "CONFIRMED" | "PENDING" | "WAITLISTED" | null;

interface AttendButtonProps {
  eventId: string;
  initialIsAttending: boolean;
  initialStatus: AttendanceStatus;
  isFull: boolean;
  priceAmount: number;
  estimatedSpend?: string | null;
  serviceFeeRate?: number;
  initialOrderCode?: string | null;
  initialOrderAmount?: number | null;
  initialPlatformFee?: number | null;
  initialDepositFee?: number | null;
  initialCouponCode?: string | null;
}

function QRCodeRenderer({ type, customUrl }: { type: "wechat" | "alipay"; customUrl?: string }) {
  const [imageError, setImageError] = useState(false);
  const isWeChat = type === "wechat";
  const color = isWeChat ? "#07C160" : "#1677FF";

  // Reset error when URL changes
  useEffect(() => {
    setImageError(false);
  }, [customUrl]);

  const showCustomImage = customUrl && !imageError;

  return (
    <div className="relative flex flex-col items-center p-5 bg-white border border-[#F0E4E0] rounded-3xl shadow-xs transition-transform duration-300 hover:scale-[1.02]">
      {showCustomImage ? (
        <div className="relative w-40 h-40 bg-white border border-[#F0E4E0]/45 rounded-2xl overflow-hidden flex items-center justify-center p-1">
          {/* Use standard img with onError fallback for maximum domain compatibility */}
          <img
            src={customUrl}
            alt={`${isWeChat ? "微信" : "支付宝"}收款码`}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <>
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
        </>
      )}
      <span className="mt-3 text-xs font-semibold text-[#2D2420] opacity-80">
        扫一扫转账预付款
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
  estimatedSpend = "中端品质 (￥100-200/人)",
  serviceFeeRate = 20,
  initialOrderCode = null,
  initialOrderAmount = null,
  initialPlatformFee = null,
  initialDepositFee = null,
  initialCouponCode = null,
}: AttendButtonProps) {
  const [isAttending, setIsAttending] = useState(initialIsAttending);
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(initialOrderCode);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeQR, setActiveQR] = useState<'wechat' | 'alipay'>('wechat');

  // 新增 2 笔费用明细的响应式状态与数据源
  const [orderAmount, setOrderAmount] = useState<number | null>(initialOrderAmount);
  const [orderPlatformFee, setOrderPlatformFee] = useState<number | null>(initialPlatformFee);
  const [orderDepositFee, setOrderDepositFee] = useState<number | null>(initialDepositFee);
  const [orderCouponCode, setOrderCouponCode] = useState<string | null>(initialCouponCode);

  const [wechatQRCodeUrl, setWechatQRCodeUrl] = useState("");
  const [alipayQRCodeUrl, setAlipayQRCodeUrl] = useState("");

  const [coupons, setCoupons] = useState<any[]>([]);
  const [hasPro, setHasPro] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
  const [useCoupon, setUseCoupon] = useState(true);
  const [isPayDetailsDialogOpen, setIsPayDetailsDialogOpen] = useState(false);

  // 拉取公共收款码配置
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setWechatQRCodeUrl(data.wechatQRCodeUrl || "");
          setAlipayQRCodeUrl(data.alipayQRCodeUrl || "");
        }
      })
      .catch(console.error);
  }, []);

  // 初始化拉取优惠券与Pro订阅状态
  useEffect(() => {
    if (priceAmount > 0) {
      // 1. 获取用户属性，判断是否是Pro会员
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            setHasPro(
              data.user.role === "ADMIN" ||
              data.user.isPro ||
              data.user.subscriptionStatus === "ACTIVE"
            );
          }
        })
        .catch(console.error);

      // 2. 获取有效免费券列表
      fetch("/api/coupons")
        .then((res) => res.json())
        .then((data) => {
          if (data?.coupons) {
            const active = data.coupons.filter((c: any) => !c.isUsed && !c.isExpired);
            setCoupons(active);
            if (active.length > 0) {
              setSelectedCoupon(active[0].code);
            }
          }
        })
        .catch(console.error);
    }
  }, [priceAmount]);

  const handleCopyCode = () => {
    if (!orderCode) return;
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 确认付款生成订单流程
  const handleConfirmReservation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: (useCoupon && selectedCoupon && !hasPro) ? selectedCoupon : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "生成预订订单失败");
        return;
      }

      if (data.order) {
        setOrderCode(data.order.orderCode);
        setOrderAmount(data.order.amount);
        setOrderPlatformFee(data.order.platformFee);
        setOrderDepositFee(data.order.depositFee);
        setOrderCouponCode(data.order.couponCode);

        setIsAttending(true);
        setStatus("PENDING");
        setIsPayDetailsDialogOpen(false);
        setIsPayDialogOpen(true);
      }
    } catch (error) {
      alert("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setLoading(true);

    try {
      if (isAttending) {
        // 退出活动
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
        setOrderAmount(null);
        setOrderPlatformFee(null);
        setOrderDepositFee(null);
        setOrderCouponCode(null);
        window.location.reload();
      } else {
        // 加入活动
        if (priceAmount > 0) {
          // 如果是收费活动（有押金），先展示高颜值的付费确认明细弹窗
          setIsPayDetailsDialogOpen(true);
        } else {
          // 免费活动直接加入
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

  // Dynamic platform fee calculation to align perfectly with the backend
  const BUDGET_REFERENCE_PRICES: Record<string, number> = {
    "经济实惠 (￥50-100/人)": 75,
    "中端品质 (￥100-200/人)": 150,
    "轻奢小资 (￥200-350/人)": 275,
    "高端奢华 (￥350+/人)": 400,
  };
  const refSpend = estimatedSpend || "中端品质 (￥100-200/人)";
  const refPrice = BUDGET_REFERENCE_PRICES[refSpend] || 150;
  
  const basePlatformFee = Math.round(refPrice * (serviceFeeRate / 100));

  const calculatedPlatformFee = hasPro ? 0 : (coupons.length > 0 && useCoupon ? 0 : basePlatformFee);
  const calculatedTotalAmount = calculatedPlatformFee + priceAmount;

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
                {loading ? "处理中..." : `报名活动（应付押金 ￥${priceAmount}）`}
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

        {/* 待对账合并计费横幅 */}
        {isAttending && status === "PENDING" && orderCode && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[13px] leading-relaxed max-w-md shadow-2xs">
            <div className="flex items-center gap-2 font-semibold mb-1 text-amber-900">
              <ClipboardList className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>待核对付款信息</span>
            </div>
            <p className="mb-2 opacity-95">
              您已成功提交报名申请！请扫码支付总金额 <strong className="text-amber-900">￥{orderAmount ?? calculatedTotalAmount}</strong> 并备注专属备注码：
            </p>
            <div className="flex items-center gap-2 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-200/50 w-fit font-mono text-base font-bold text-amber-900 mb-2">
              <span>{orderCode}</span>
              <button onClick={handleCopyCode} className="hover:text-amber-700 p-0.5" title="复制备注码">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="text-[11px] opacity-80 leading-normal border-t border-amber-200/60 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>• 平台组织服务费：</span>
                <span>
                  {orderPlatformFee === 0 ? (
                    <span className="text-green-600 font-semibold">￥0 (免费券/订阅已抵扣)</span>
                  ) : (
                    `￥${orderPlatformFee ?? calculatedPlatformFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>• 出席押金 (履约后退回)：</span>
                <span>￥{orderDepositFee ?? priceAmount}</span>
              </div>
            </div>
            
            <p className="text-[10px] opacity-75 leading-tight mt-2.5">
              * 管理员将在核对微信/支付宝转账附言中的备注码后，为您解锁完整活动席位。如有疑问，可联系客服。
            </p>
          </div>
        )}
      </div>

      {/* 弹窗一：确认付费明细弹窗 */}
      <Dialog open={isPayDetailsDialogOpen} onOpenChange={setIsPayDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-sm rounded-3xl bg-[#FFFAF8] border-0 p-6 shadow-2xl ring-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-[#2D2420] flex items-center justify-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#FF2442]" />
              确认报名付费明细
            </DialogTitle>
            <DialogDescription className="text-xs text-[#B8A099] mt-1">
              饭否聚会双重安全保障机制：组织服务 + 赴约履约押金
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* 组织费条目 */}
            <div className="bg-white p-4 border border-[#F0E4E0] rounded-2xl flex justify-between items-center shadow-2xs">
              <div>
                <div className="text-sm font-bold text-[#2D2420] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  第一笔：活动组织服务费
                </div>
                <div className="text-xs text-[#B8A099] mt-1">
                  {hasPro ? (
                    <span className="text-[#07C160] font-semibold">✨ Pro 会员专属订阅，本次免费</span>
                  ) : coupons.length > 0 ? (
                    "可用注册/特赠的免费券全额抵扣"
                  ) : (
                    "基础平台运营组织费"
                  )}
                </div>
              </div>
              <div className="text-right">
                {hasPro ? (
                  <span className="text-lg font-extrabold text-[#07C160]">￥0</span>
                ) : coupons.length > 0 && useCoupon ? (
                  <span className="text-lg font-extrabold text-[#07C160] flex flex-col items-end">
                    <span>￥0</span>
                    <span className="text-[10px] text-[#B8A099] font-normal line-through">￥{basePlatformFee}</span>
                  </span>
                ) : (
                  <span className="text-lg font-extrabold text-[#2D2420]">￥{basePlatformFee}</span>
                )}
              </div>
            </div>

            {/* 优惠券选择下拉列表 */}
            {!hasPro && coupons.length > 0 && (
              <div className="bg-[#FFF5F3] p-3 rounded-2xl border border-[#F0E4E0] space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-[#8f7772] flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#FF2442]" />
                    使用可用免费餐券
                  </Label>
                  <input
                    type="checkbox"
                    checked={useCoupon}
                    onChange={(e) => setUseCoupon(e.target.checked)}
                    className="h-4 w-4 text-[#FF2442] focus:ring-[#FF2442] border-[#F0E4E0] rounded"
                  />
                </div>
                {useCoupon && (
                  <select
                    value={selectedCoupon}
                    onChange={(e) => setSelectedCoupon(e.target.value)}
                    className="w-full bg-white border border-[#F0E4E0] rounded-xl text-xs p-2 text-[#2D2420] focus:ring-[#FF2442] focus:border-[#FF2442] font-mono"
                  >
                    {coupons.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} ({c.welcomeText.replace("[专属赠券]", "").trim().slice(0, 16)}...)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* 押金服务费条目 */}
            <div className="bg-white p-4 border border-[#F0E4E0] rounded-2xl flex justify-between items-center shadow-2xs">
              <div>
                <div className="text-sm font-bold text-[#2D2420] flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-[#FF2442]" />
                  第二笔：预付餐费出席押金
                </div>
                <div className="text-xs text-[#B8A099] mt-1">
                  出席押金，现场正常赴约后全额原路退还
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-[#2D2420]">￥{priceAmount}</span>
              </div>
            </div>

            {/* 总额板块 */}
            <div className="bg-[#FFF0F3] p-4 border border-[#FF2442]/10 rounded-2xl text-center">
              <span className="text-xs text-[#B8A099]">最终合并支付总金额</span>
              <div className="text-3xl font-black text-[#FF2442] mt-0.5">
                ￥{calculatedTotalAmount}
              </div>
              <div className="text-[10px] text-[#B8A099] mt-1.5 flex items-center justify-center gap-1 leading-normal">
                {calculatedPlatformFee === 0 ? (
                  <span>✨ 平台服务费已全额免除，仅需支付可退的出席保证金</span>
                ) : (
                  <span>合并计费：{basePlatformFee}元平台服务费 + {priceAmount}元出席保证金（保证金可退）</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={handleConfirmReservation}
              disabled={loading}
              className="w-full rounded-full bg-[#FF2442] hover:bg-[#FF4D63] text-white font-bold py-2.5 shadow-md transition-all active:scale-[0.98]"
            >
              {loading ? "处理中..." : "确认预订并获取付款备注码"}
            </Button>
            <Button
              onClick={() => setIsPayDetailsDialogOpen(false)}
              variant="ghost"
              className="w-full rounded-full text-[#B8A099] hover:text-[#2D2420]"
            >
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 弹窗二：扫码转账支付弹窗 */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-sm rounded-3xl bg-[#FFFAF8] border-0 p-6 shadow-2xl ring-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-[#2D2420] flex items-center justify-center gap-2">
              <Wallet className="w-5 h-5 text-[#FF2442]" />
              完成合并款项支付
            </DialogTitle>
            <DialogDescription className="text-xs text-[#B8A099] mt-1">
              就餐现场各自向餐厅付餐费，此处仅支付合并保证金与服务费
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 mt-4">
            {/* 合并计费细则看板 */}
            <div className="w-full bg-white p-4 border border-[#F0E4E0] rounded-2xl shadow-2xs space-y-2.5">
              <div className="flex justify-between items-center text-xs text-[#B8A099]">
                <span>费用明细</span>
                <span className="text-lg font-black text-[#FF2442]">合计应付：￥{orderAmount ?? calculatedTotalAmount}</span>
              </div>
              <div className="border-t border-[#F0E4E0] pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-[#8f7772]">
                  <span>1. 平台组织服务费：</span>
                  <span className="font-semibold text-[#2D2420]">
                    {(orderPlatformFee ?? calculatedPlatformFee) === 0 ? (
                      <span className="text-[#07C160]">￥0 (免费券/Pro已免除)</span>
                    ) : (
                      `￥${orderPlatformFee ?? calculatedPlatformFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[#8f7772]">
                  <span>2. 出席押金 (履约后退还)：</span>
                  <span className="font-semibold text-[#2D2420]">￥{orderDepositFee ?? priceAmount}</span>
                </div>
              </div>
              {orderCouponCode && (
                <div className="bg-[#FFF5F3] px-2.5 py-1.5 rounded-lg border border-[#FF2442]/10 text-[10px] text-[#FF2442] flex justify-between font-mono">
                  <span>已锁抵扣券:</span>
                  <span className="font-bold">{orderCouponCode}</span>
                </div>
              )}
            </div>

            {/* 微信/支付宝选择 */}
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

            {/* 二维码展示 */}
            <div className="flex justify-center w-full min-h-[220px]">
              <QRCodeRenderer
                type={activeQR}
                customUrl={activeQR === "wechat" ? wechatQRCodeUrl : alipayQRCodeUrl}
              />
            </div>

            {/* 唯一对账备注码 */}
            <div className="w-full bg-[#FFF0F3] border border-[#FF2442]/10 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-xs text-[#FF2442] font-semibold flex items-center gap-1.5 mb-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                转账时务必填写此对账备注码
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
                为了后台财务对账匹配，请将上方的字符填写至转账的<strong>「留言/附言/备注」</strong>中。
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
              我已扫码支付，等待管理员确认
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
