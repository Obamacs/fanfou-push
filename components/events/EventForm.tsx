"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES, CITIES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    initialData?.date
      ? new Date(initialData.date).toISOString().slice(0, 16)
      : ""
  );
  const [maxAttendees, setMaxAttendees] = useState(
    initialData?.maxAttendees?.toString() || "6"
  );
  const [priceAmount, setPriceAmount] = useState(
    initialData?.priceAmount?.toString() || "0"
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
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

      if (mode === "create") {
        router.push("/events");
      } else {
        router.push(`/events/${initialData?.id}`);
      }
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">活动标题 *</Label>
        <Input
          id="title"
          placeholder="例如：周末户外爬山"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">活动类型 *</Label>
        <Select value={type} onValueChange={(value) => setType(value || "")} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="选择活动类型" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">所在城市 *</Label>
        <Select value={city} onValueChange={(value) => setCity(value || "")} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="选择城市" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">详细地址</Label>
        <Input
          id="address"
          placeholder="具体位置"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Date and Time */}
      <div className="space-y-2">
        <Label htmlFor="date">活动时间 *</Label>
        <Input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Max Attendees */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxAttendees">最多人数</Label>
          <Input
            id="maxAttendees"
            type="number"
            min="2"
            max="20"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="priceAmount">活动费用（元）</Label>
          <Input
            id="priceAmount"
            type="number"
            min="0"
            value={priceAmount}
            onChange={(e) => setPriceAmount(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">活动描述</Label>
        <Textarea
          id="description"
          placeholder="详细介绍活动内容、集合地点、注意事项等"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={4}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>活动图片</Label>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          label="选择活动图片"
        />
      </div>

      {/* Error message */}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading
          ? "提交中..."
          : mode === "create"
          ? "创建活动"
          : "保存修改"}
      </Button>
    </form>
  );
}
