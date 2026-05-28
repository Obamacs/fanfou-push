"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RedirectCountdownProps {
  targetUrl: string;
  seconds?: number;
}

export function RedirectCountdown({ targetUrl, seconds = 3 }: RedirectCountdownProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      router.push(targetUrl);
      router.refresh();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, targetUrl, router]);

  return (
    <p className="text-xs text-[#B8A099] text-center transition-all duration-300">
      页面将在 <span className="font-semibold text-[#FF2442] mx-0.5">{timeLeft}</span> 秒后自动返回...
    </p>
  );
}
