"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENT_TYPES, CITIES } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { Search, X } from "lucide-react";

function EventFiltersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [type, setType] = useState(searchParams.get("type") || "");

  const hasFilters = city || type;

  const handleFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/events?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8A099]" />
        <Input
          placeholder="搜索城市..."
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            handleFilter("city", e.target.value);
          }}
          className="pl-9 rounded-xl border-gray-200 bg-white text-[15px] h-10 w-full"
        />
      </div>

      <Select value={type} onValueChange={(v) => { setType(v || ""); handleFilter("type", v || ""); }}>
        <SelectTrigger className="max-w-[160px] rounded-xl border-gray-200 bg-white text-[15px] h-10">
          <SelectValue placeholder="活动类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">全部类型</SelectItem>
          {EVENT_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCity("");
            setType("");
            router.push("/events");
          }}
          className="rounded-full text-[13px] text-[#B8A099] hover:text-[#2D2420]"
        >
          <X className="w-3.5 h-4 mr-1" />
          清除筛选
        </Button>
      )}
    </div>
  );
}

export function EventFilters() {
  return (
    <Suspense fallback={<div className="h-10" />}>
      <EventFiltersInner />
    </Suspense>
  );
}
