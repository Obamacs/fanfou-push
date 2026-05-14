"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENT_TYPES, CITIES, EVENT_TYPE_COLORS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    type: string;
    city: string;
    address?: string | null;
    date: Date | string;
    maxAttendees: number;
    priceAmount: number;
    description?: string | null;
    imageUrl?: string | null;
  };
  matchId?: string;
  matchMembers?: string[];
}

export function EventForm({ mode, initialData, matchId, matchMembers = [] }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [type, setType] = useState(initialData?.type || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [date, setDate] = useState(
    initialData?.date ? new Date(initialData.date).toISOString().slice(0, 16) : ""
  );
  const [maxAttendees, setMaxAttendees] = useState(initialData?.maxAttendees?.toString() || "6");
  const [priceAmount, setPriceAmount] = useState(initialData?.priceAmount?.toString() || "0");
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !type || !city || !date) {
      setError("请填写所有必填项");
      return;
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
      setError("活动时间必须是未来的时间");
      return;
    }

    const max = parseInt(maxAttendees, 10);
    if (isNaN(max) || max < 2 || max > 20) {
      setError("最多人数必须在2-20之间");
      return;
    }

    const price = parseInt(priceAmount, 10);
    if (isNaN(price) || price < 0) {
      setError("费用不能为负数");
      return;
    }

    setLoading(true);

    try {
      const body = {
        title: title.trim(),
        type,
        city,
        address: address.trim() || null,
        date: eventDate.toISOString(),
        maxAttendees: max,
        priceAmount: price,
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        matchId: matchId || null,
        autoInviteMembers: matchMembers.length > 0 ? matchMembers : null,
      };

      const method = mode === "create" ? "POST" : "PATCH";
      const url = mode === "create" ? "/api/events" : `/api/events/${initialData?.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "操作失败");
        return;
      }

      router.push(mode === "create" ? "/events" : `/events/${initialData?.id}`);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "rounded-xl border-[#F0E4E0] bg-white focus:border-[#FF2442] focus:ring-[#FF2442] text-[15px] h-12 transition-colors";
  const labelClass = "text-[13px] font-semibold text-[#2D2420] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className={labelClass}>活动标题 *</Label>
        <Input
          id="title"
          placeholder="给你的活动起个吸引人的名字"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          className={inputClass}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-1.5">
        <Label className={labelClass}>活动封面</Label>
        <ImageUpload value={imageUrl} onChange={setImageUrl} label="选择活动封面图片" type="event" />
      </div>

      {/* Type + City */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className={labelClass}>活动类型 *</Label>
          <Select value={type} onValueChange={(v) => setType(v || "")} disabled={loading}>
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => {
                const c = EVENT_TYPE_COLORS[t];
                return (
                  <SelectItem key={t} value={t}>
                    <span className="flex items-center gap-2">
                      <span>{c?.icon}</span> {t}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>所在城市 *</Label>
          <Select value={city} onValueChange={(v) => setCity(v || "")} disabled={loading}>
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="选择城市" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="address" className={labelClass}>详细地址</Label>
        <Input
          id="address"
          placeholder="具体位置（选填）"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading}
          className={inputClass}
        />
      </div>

      {/* Date + Time */}
      <div className="space-y-1.5">
        <Label htmlFor="date" className={labelClass}>活动时间 *</Label>
        <Input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={loading}
          className={inputClass}
        />
      </div>

      {/* Max + Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="maxAttendees" className={labelClass}>最多人数</Label>
          <Input
            id="maxAttendees"
            type="number"
            min="2"
            max="20"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priceAmount" className={labelClass}>活动费用（元）</Label>
          <Input
            id="priceAmount"
            type="number"
            min="0"
            value={priceAmount}
            onChange={(e) => setPriceAmount(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className={labelClass}>活动描述</Label>
        <Textarea
          id="description"
          placeholder="介绍活动内容、集合地点、注意事项等，让参与者了解更多细节"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={4}
          className="rounded-xl border-gray-200 bg-white focus:border-[#FF2442] text-[15px]"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3 bg-gradient-to-r from-[#FF2442] to-[#FF6B35] hover:from-[#FF4D63] hover:to-[#FF8C69] text-white text-[15px] font-semibold h-12 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
      >
        {loading ? "提交中..." : mode === "create" ? (
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            创建活动
          </span>
        ) : "保存修改"}
      </Button>
    </form>
  );
}
