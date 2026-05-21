"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, X, Search, CreditCard, RefreshCw, User, Calendar, Ticket } from "lucide-react";

interface Order {
  id: string;
  orderCode: string;
  amount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  event: {
    title: string;
    priceAmount: number;
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
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
  };

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      void fetchOrders();
    }
    return () => {
      isMounted = false;
    };
  }, [statusFilter, searchQuery]);

  const handleProcessOrder = async (orderId: string, action: "confirm" | "cancel") => {
    if (!confirm(`确定要${action === "confirm" ? "确认收款" : "取消这笔预约"}吗？`)) {
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
        alert(data.message || "对账处理成功！");
        // Refresh local list
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: action === "confirm" ? "CONFIRMED" : "CANCELLED" } : o));
      } else {
        alert(data.error || "处理失败");
      }
    } catch (err) {
      console.error("Process order failed:", err);
      alert("网络错误，请重试");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">待核对</span>;
      case "CONFIRMED":
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">已确认</span>;
      case "CANCELLED":
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">已取消</span>;
      default:
        return <span className="px-2 py-1 bg-[#2D1E1A] text-[#6B5A55] text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">订单核对</h1>
          <p className="text-sm text-[#b8a099] mt-1">
            手动审核微信或支付宝转账保证金，核对备注码（MMXXXX）后一键确认名额。
          </p>
        </div>
        <Button
          onClick={() => void fetchOrders()}
          variant="outline"
          size="sm"
          className="border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-white self-start sm:self-auto rounded-full px-4"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          刷新列表
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8A099]" />
          <Input
            placeholder="搜索备注码、用户邮箱或活动标题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#241918] border-[#2D1E1A] text-white pl-10 rounded-full focus:ring-[#FF2442] focus:border-[#FF2442]"
          />
        </div>

        {/* Tab filters */}
        <div className="flex bg-[#1A1311] p-1 border border-[#2D1E1A] rounded-full">
          {[
            { value: "PENDING", label: "待核对" },
            { value: "CONFIRMED", label: "已确认" },
            { value: "CANCELLED", label: "已取消" },
            { value: "ALL", label: "全部" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                statusFilter === tab.value
                  ? "bg-[#FF2442] text-white"
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
        <div className="py-12 text-center text-[#B8A099]">加载中...</div>
      ) : orders.length === 0 ? (
        <Card className="bg-[#241918] border-[#2D1E1A] p-12 text-center rounded-2xl">
          <CreditCard className="w-12 h-12 mx-auto text-[#6B5A55] mb-4 opacity-40" />
          <p className="text-white font-medium">暂无订单数据</p>
          <p className="text-sm text-[#b8a099] mt-1">没有符合当前筛选条件的订单记录。</p>
        </Card>
      ) : (
        <Card className="bg-[#241918] border-[#2D1E1A] overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1A1311] border-b border-[#2D1E1A]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    专属备注码
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    活动信息
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    预订金额
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    订单状态
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#B8A099] uppercase tracking-wider">
                    后台操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D1E1A]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#1A1311]/40 transition-colors">
                    {/* Order Code */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-[#FF4D94] bg-[#FF4D94]/10 px-3 py-1 rounded-xl border border-[#FF4D94]/15">
                          {order.orderCode}
                        </span>
                      </div>
                    </td>

                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <User className="w-3.5 h-3.5 mt-0.5 text-[#B8A099]" />
                        <div>
                          <p className="text-white font-semibold text-sm leading-tight">{order.user.name}</p>
                          <p className="text-[#B8A099] text-xs mt-0.5 leading-tight">{order.user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Event Info */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 mt-0.5 text-[#B8A099]" />
                        <div>
                          <p className="text-white font-medium text-sm leading-tight line-clamp-1">{order.event.title}</p>
                          <p className="text-[#B8A099] text-xs mt-0.5 leading-tight">
                            创建时间: {new Date(order.createdAt).toLocaleString("zh-CN", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Price Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <Ticket className="w-3.5 h-3.5 text-[#B8A099]" />
                        <span>￥{order.amount}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Admin Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {order.status === "PENDING" ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            disabled={actionLoadingId === order.id}
                            onClick={() => handleProcessOrder(order.id, "confirm")}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-3"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            确认收款
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoadingId === order.id}
                            onClick={() => handleProcessOrder(order.id, "cancel")}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-full px-3"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            取消预订
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
    </div>
  );
}
