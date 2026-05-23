"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "仪表板", exact: true },
  { href: "/admin/users", label: "用户" },
  { href: "/admin/events", label: "活动" },
  { href: "/admin/orders", label: "订单核对" },
  { href: "/admin/invites", label: "邀请管理" },
  { href: "/admin/matchmaking", label: "分桌引擎" },
  { href: "/admin/questionnaire", label: "问卷管理" },
  { href: "/admin/interests", label: "兴趣管理" },
  { href: "/admin/reports", label: "举报" },
  { href: "/admin/statistics", label: "统计" },
  { href: "/admin/settings", label: "设置" },
];

export function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "font-semibold text-[#ff2442] transition-colors hover:text-[#ff6b5f]"
                : "font-medium text-[#b8a099] transition-colors hover:text-white"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
