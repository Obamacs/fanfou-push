"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  Check,
  X,
  Search,
  CreditCard,
  RefreshCw,
  User,
  Calendar,
  Ticket,
  Wallet,
  ClipboardCopy,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  orderCode: string;
  amount: number;
  platformFee: number;
  depositFee: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  refundStatus: "NOT_ELIGIBLE" | "ELIGIBLE" | "REFUNDED" | "FORFEITED";
  refundedAt?: string | null;
  refundOperator?: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    refundMethod?: string | null;
    refundAccount?: string | null;
    refundRealName?: string | null;
  };
  event: {
    title: string;
    priceAmount: number;
    date: string;
  };
}

export default function AdminOrdersPage() {
  const { toast, confirm } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  
  // Refund dialog states
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<Order | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Handle special Tab filters
      if (statusFilter === "REFUND_DEPOSIT") {
        params.append("status", "CONFIRMED"); // Refunds are only processed on confirmed orders
      } else if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      if (searchQuery) {
        params.append("q", searchQuery);
      }
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleProcessOrder = async (orderId: string, action: "confirm" | "cancel") => {
    const isConfirmed = await confirm(`确定要${action === "confirm" ? "确认收款" : "取消这笔预约"}吗？`, "确认操作");
    if (!isConfirmed) {
      return;
    }
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "操作处理成功！");
        setOrders(
          orders.map((o) =>
            o.id === orderId
              ? { ...o, status: action === "confirm" ? "CONFIRMED" : "CANCELLED" }
              : o
          )
        );
      } else {
        toast.error(data.error || "处理失败");
      }
    } catch (err) {
      console.error("Process order failed:", err);
      toast.error("网络错误，请重试");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleProcessRefund = async (orderId: string, action: "refund" | "forfeit") => {
    const isRefund = action === "refund";
    const isConfirmed = await confirm(
      isRefund
        ? "确定您已线下完成手动打款，并在此登记已退还保证金吗？"
        : "确定该用户无故缺席（放鸽子），要没收其出席保证金吗？",
      "确认处理"
    );
    if (!isConfirmed) {
      return;
    }

    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "对账处理成功！");
        setOrders(
          orders.map((o) =>
            o.id === orderId
              ? { ...o, refundStatus: isRefund ? "REFUNDED" : "FORFEITED" }
              : o
          )
        );
        setIsRefundDialogOpen(false);
      } else {
        toast.error(data.error || "处理失败");
      }
    } catch (err) {
      console.error("Process refund failed:", err);
      toast.error("网络错误，请重试");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyRefundInfo = (order: Order) => {
    if (!order.user.refundAccount) return;
    const info = `退款渠道: ${order.user.refundMethod === "WECHAT" ? "微信支付" : "支付宝"} | 账号: ${order.user.refundAccount} | 姓名: ${order.user.refundRealName || "未填写"}`;
    navigator.clipboard.writeText(info);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/15">
            待核对
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full border border-green-500/15">
            已支付
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded-full border border-red-500/15">
            已取消
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-[#2D1E1A] text-[#6B5A55] text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  const getRefundStatusBadge = (order: Order) => {
    const status = order.refundStatus;
    switch (status) {
      case "NOT_ELIGIBLE":
        const eventDate = new Date(order.event.date);
        const now = new Date();
        if (eventDate < now) {
          return (
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/15 animate-pulse">
              待审核 (活动结束)
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 bg-zinc-500/10 text-zinc-400 text-xs font-semibold rounded-full border border-zinc-500/15">
            就餐中/未开始
          </span>
        );
      case "ELIGIBLE":
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/15 animate-pulse">
            待核销退款
          </span>
        );
      case "REFUNDED":
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/15">
            已退款
          </span>
        );
      case "FORFEITED":
        return (
          <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-xs font-semibold rounded-full border border-red-500/15">
            已没收 (放鸽子)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  const isRefundTab = statusFilter === "REFUND_DEPOSIT";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-8 h-8 text-[#FF2442]" />
            财务对账管理
          </h1>
          <p className="text-sm text-[#b8a099] mt-1">
            {isRefundTab
              ? "审核聚餐后的用户出席情况，针对已履约的用户，查验其登记的微信/支付宝退款账户进行一键对账核销。"
              : "手动审核微信或支付宝扫码转账，核对对账码（MMXXXX）后一键激活用户晚餐报名名额。"}
          </p>
        </div>
        <Button
          onClick={() => void fetchOrders()}
          variant="outline"
          size="sm"
          className="border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-white self-start sm:self-auto rounded-full px-5 py-2 shadow-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin-slow" />
          刷新列表
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8A099]" />
          <Input
            placeholder="搜索备注码、用户姓名、邮箱或活动标题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#241918] border-[#2D1E1A] text-white pl-10 pr-4 rounded-full focus:ring-[#FF2442] focus:border-[#FF2442]"
          />
        </div>

        {/* Tab filters */}
        <div className="flex flex-wrap bg-[#1A1311] p-1.5 border border-[#2D1E1A] rounded-2xl gap-1">
          {[
            { value: "PENDING", label: "待核对收款" },
            { value: "CONFIRMED", label: "已支付订单" },
            { value: "REFUND_DEPOSIT", label: "保证金退还对账 🎟️" },
            { value: "CANCELLED", label: "已取消预订" },
            { value: "ALL", label: "全部订单" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                statusFilter === tab.value
                  ? "bg-[#FF2442] text-white shadow-md scale-[1.02]"
                  : "text-[#B8A099] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table/Cards */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center text-[#B8A099]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2442] mb-3" />
          <span>正在检索订单账单数据...</span>
        </div>
      ) : orders.length === 0 ? (
        <Card className="bg-[#241918] border-[#2D1E1A] p-16 text-center rounded-3xl shadow-lg">
          <CreditCard className="w-14 h-14 mx-auto text-[#6B5A55] mb-4 opacity-40 animate-pulse" />
          <p className="text-white text-lg font-bold">暂无订单数据</p>
          <p className="text-sm text-[#b8a099] mt-1.5">没有符合当前筛选条件的订单对账记录。</p>
        </Card>
      ) : (
        <Card className="bg-[#241918] border-[#2D1E1A] overflow-hidden rounded-3xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1A1311] border-b border-[#2D1E1A]">
                <tr>
                  <th className="px-6 py-4.5 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    对账备注码
                  </th>
                  <th className="px-6 py-4.5 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-4.5 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    活动详情 & 计费
                  </th>
                  {isRefundTab ? (
                    <>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                        应退保证金
                      </th>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                        退款登记状态
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                        应付总额
                      </th>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                        订单状态
                      </th>
                    </>
                  )}
                  <th className="px-6 py-4.5 text-right text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    后台操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D1E1A]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#1A1311]/30 transition-colors">
                    {/* Order Code */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-extrabold text-[#FF4D94] bg-[#FF4D94]/10 px-3 py-1.5 rounded-xl border border-[#FF4D94]/15">
                        {order.orderCode}
                      </span>
                    </td>

                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 mt-0.5 text-[#B8A099]" />
                        <div>
                          <p className="text-white font-bold text-sm leading-tight">{order.user.name}</p>
                          <p className="text-[#B8A099] text-xs mt-1 leading-tight">{order.user.email}</p>
                          {isRefundTab && order.user.refundMethod ? (
                            <div className="mt-1.5 flex items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${order.user.refundMethod === "WECHAT" ? "bg-[#07C160]/10 text-[#07C160]" : "bg-[#1677FF]/10 text-[#1677FF]"}`}>
                                {order.user.refundMethod === "WECHAT" ? "微" : "支"}
                              </span>
                              <span className="text-[10px] text-[#B8A099] font-mono">{order.user.refundAccount}</span>
                            </div>
                          ) : isRefundTab ? (
                            <span className="text-[10px] text-red-400 mt-1 block">⚠️ 尚未绑定退款账户</span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Event Info & Fees */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-0.5 text-[#B8A099]" />
                        <div>
                          <p className="text-white font-semibold text-sm leading-tight line-clamp-1">{order.event.title}</p>
                          <div className="text-[11px] text-[#B8A099] mt-1 space-y-0.5">
                            <p>预订时间: {new Date(order.createdAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
                            <p className="text-[#FF2442]/80 font-semibold font-mono">
                              明细: 组织费￥{order.platformFee} + 押金￥{order.depositFee}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price/Refund Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-white font-bold font-mono">
                        <Ticket className="w-4 h-4 text-[#B8A099]" />
                        <span>￥{isRefundTab ? order.depositFee : order.amount}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isRefundTab
                        ? getRefundStatusBadge(order)
                        : getStatusBadge(order.status)}
                    </td>

                    {/* Admin Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {isRefundTab ? (
                        <div className="flex gap-2 justify-end">
                          {order.refundStatus === "REFUNDED" || order.refundStatus === "FORFEITED" ? (
                            <span className="text-[#6B5A55] text-xs italic flex items-center justify-end gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              已对账结清
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              disabled={actionLoadingId === order.id}
                              onClick={() => {
                                setSelectedRefundOrder(order);
                                setIsRefundDialogOpen(true);
                              }}
                              className="bg-[#FF2442] hover:bg-[#FF4D63] text-white rounded-xl px-4 shadow-sm transition-all"
                            >
                              去核销退款
                              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      ) : order.status === "PENDING" ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            disabled={actionLoadingId === order.id}
                            onClick={() => handleProcessOrder(order.id, "confirm")}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-3.5"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            确认收款
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoadingId === order.id}
                            onClick={() => handleProcessOrder(order.id, "cancel")}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl px-3.5"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            取消
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[#6B5A55] text-xs italic">已归档</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dynamic Refund Details Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        {selectedRefundOrder && (
          <DialogContent className="bg-[#241918] border-[#2D1E1A] text-white rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-5.5 h-5.5 text-[#FF2442]" />
                线下退款保证金对账
              </DialogTitle>
              <DialogDescription className="text-xs text-[#B8A099]">
                请使用微信或支付宝扫描打款给用户，核对金额一致后，在下方登记已完成退款。
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4 bg-[#1A1311] border border-[#2D1E1A] p-5 rounded-2xl">
              {/* Refund Info Details */}
              <div className="flex justify-between items-center py-1.5 border-b border-[#2D1E1A]">
                <span className="text-xs text-[#B8A099]">退款金额：</span>
                <span className="text-lg font-mono font-bold text-[#FF2442]">￥{selectedRefundOrder.depositFee} 元</span>
              </div>

              <div className="space-y-2 py-1.5">
                <p className="text-xs text-[#B8A099]">用户绑定收款账号信息：</p>
                {selectedRefundOrder.user.refundAccount ? (
                  <div className="bg-[#241918] border border-[#3D2C28] p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#B8A099]">渠道:</span>
                      <span className={`font-bold ${selectedRefundOrder.user.refundMethod === "WECHAT" ? "text-[#07C160]" : "text-[#1677FF]"}`}>
                        {selectedRefundOrder.user.refundMethod === "WECHAT" ? "微信支付" : "支付宝"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#B8A099]">账号:</span>
                      <span className="font-mono font-bold text-white selection:bg-[#FF2442]">{selectedRefundOrder.user.refundAccount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#B8A099]">收款实名:</span>
                      <span className="font-bold text-white">{selectedRefundOrder.user.refundRealName || "未填写"}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyRefundInfo(selectedRefundOrder)}
                      className="w-full text-xs border-[#2D1E1A] bg-[#1A1311] hover:bg-[#1A1311]/50 text-white rounded-lg mt-2 flex items-center justify-center gap-1.5"
                    >
                      <ClipboardCopy className="w-3.5 h-3.5" />
                      {copiedText ? "已复制到剪贴板！" : "一键复制收款信息"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                    <p className="text-sm text-red-400 font-semibold">⚠️ 该用户尚未绑定任何退款账户</p>
                    <p className="text-[11px] text-[#6B5A55] mt-1">请先联系用户前往“个人中心-我的资料”绑定退款支付宝/微信账户。</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                disabled={actionLoadingId === selectedRefundOrder.id || !selectedRefundOrder.user.refundAccount}
                onClick={() => handleProcessRefund(selectedRefundOrder.id, "refund")}
                className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white py-2.5 font-bold"
              >
                已线下完成手动打款，核销为“已退款”
              </Button>
              <Button
                disabled={actionLoadingId === selectedRefundOrder.id}
                onClick={() => handleProcessRefund(selectedRefundOrder.id, "forfeit")}
                variant="outline"
                className="w-full rounded-full border-red-500/20 bg-red-900/10 text-red-400 hover:bg-red-900/20 py-2.5 font-bold"
              >
                用户放鸽子缺席，登记没收保证金
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsRefundDialogOpen(false)}
                className="w-full rounded-full text-[#B8A099] hover:text-white"
              >
                关闭弹窗
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
