"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reportedBy: { name: string; email: string };
  reportedUser: { name: string; email: string } | null;
  reportedEvent: { title: string } | null;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("OPEN");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    newStatus: string
  ) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setReports(
          reports.map((r) =>
            r.id === reportId ? { ...r, status: newStatus } : r
          )
        );
      }
    } catch (err) {
      console.error("Failed to update report:", err);
    }
  };

  const filteredReports = reports.filter((r) => r.status === filterStatus);

  if (loading) {
    return <div className="text-[#B8A099]">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">举报管理</h1>
        <div className="text-[#B8A099]">共 {reports.length} 个举报</div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            onClick={() => setFilterStatus(status)}
            className={
              filterStatus === status
                ? status === "OPEN"
                  ? "bg-[#FF2442]"
                  : status === "REVIEWING"
                  ? "bg-yellow-600"
                  : status === "RESOLVED"
                  ? "bg-[#FF6B35]"
                  : "bg-[#FF2442]"
                : ""
            }
          >
            {status === "OPEN"
              ? "待处理"
              : status === "REVIEWING"
              ? "审核中"
              : status === "RESOLVED"
              ? "已解决"
              : "已驳回"}
          </Button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card className="bg-[#241918] border-[#2D1E1A] p-6 text-center text-[#B8A099]">
            暂无举报
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              className="bg-[#241918] border-[#2D1E1A] p-6 hover:bg-[#1A1311]/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {report.reason}
                  </h3>
                  <p className="text-[#B8A099] mb-3">{report.description}</p>
                  <div className="flex gap-4 text-sm text-[#B8A099]">
                    <div>
                      <span className="text-[#6B5A55]">举报人：</span>
                      {report.reportedBy.name} ({report.reportedBy.email})
                    </div>
                    {report.reportedUser && (
                      <div>
                        <span className="text-[#6B5A55]">被举报用户：</span>
                        {report.reportedUser.name} ({report.reportedUser.email})
                      </div>
                    )}
                    {report.reportedEvent && (
                      <div>
                        <span className="text-[#6B5A55]">被举报活动：</span>
                        {report.reportedEvent.title}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
                    report.status === "OPEN"
                      ? "bg-red-500/20 text-[#FF2442]"
                      : report.status === "REVIEWING"
                      ? "bg-yellow-500/20 text-[#FF6B35]"
                      : report.status === "RESOLVED"
                      ? "bg-[#FF6B35]/20 text-[#FF6B35]"
                      : "bg-[#2D1E1A] text-[#B8A099]"
                  }`}
                >
                  {report.status === "OPEN"
                    ? "待处理"
                    : report.status === "REVIEWING"
                    ? "审核中"
                    : report.status === "RESOLVED"
                    ? "已解决"
                    : "已驳回"}
                </span>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[#2D1E1A]">
                {report.status === "OPEN" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleResolveReport(report.id, "REVIEWING")}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      开始审核
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResolveReport(report.id, "DISMISSED")}
                      variant="outline"
                    >
                      驳回
                    </Button>
                  </>
                )}
                {report.status === "REVIEWING" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleResolveReport(report.id, "RESOLVED")}
                      className="bg-[#FF6B35] hover:bg-green-700"
                    >
                      标记已解决
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResolveReport(report.id, "DISMISSED")}
                      variant="outline"
                    >
                      驳回
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
