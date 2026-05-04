"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [type, setType] = useState(searchParams.get("type") || "");

  const handleCityChange = useCallback(
    (value: string) => {
      setCity(value);
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("city", value);
      } else {
        params.delete("city");
      }
      router.push(`/events?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setType(value);
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("type", value);
      } else {
        params.delete("type");
      }
      router.push(`/events?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handleClear = useCallback(() => {
    setCity("");
    setType("");
    router.push("/events");
  }, [router]);

  const hasFilters = city || type;

  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      <Input
        placeholder="搜索城市..."
        value={city}
        onChange={(e) => handleCityChange(e.target.value)}
        className="max-w-xs"
      />

      <Select value={type} onValueChange={(value) => handleTypeChange(value || "")}>
        <SelectTrigger className="max-w-xs">
          <SelectValue placeholder="选择类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">全部类型</SelectItem>
          {EVENT_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="outline"
          onClick={handleClear}
        >
          清除筛选
        </Button>
      )}
    </div>
  );
}
