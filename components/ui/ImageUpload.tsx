"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  type?: "avatar" | "event";
  aspect?: "video" | "square";
}

export function ImageUpload({ value, onChange, label = "上传图片", type = "avatar", aspect = "video" }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "上传失败");
        return;
      }

      onChange(data.url);
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    onChange("");
  };

  const isSquare = aspect === "square";
  const containerClass = isSquare
    ? "relative w-48 h-48 mx-auto bg-[#FFF5F3] rounded-2xl overflow-hidden group shadow-sm border border-[#F0E4E0]/40"
    : "relative w-full aspect-video bg-[#FFF5F3] rounded-2xl overflow-hidden group";

  const buttonClass = isSquare
    ? `w-48 h-48 mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
        dragOver
          ? "border-[#FF2442] bg-[#FFF0F3]"
          : "border-[#F0E4E0] hover:border-[#F0E4E0] bg-[#FFF5F3]/50"
      }`
    : `w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
        dragOver
          ? "border-[#FF2442] bg-[#FFF0F3]"
          : "border-[#F0E4E0] hover:border-[#F0E4E0] bg-[#FFF5F3]/50"
      }`;

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className={containerClass}>
          <Image
            src={value}
            alt="Preview"
            fill
            className={isSquare ? "object-contain p-2 bg-white" : "object-cover"}
            unoptimized={value.includes("supabase")}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="shadow-md"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                更换
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 shadow-md"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                删除
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={loading}
          className={buttonClass}
        >
          {loading ? (
            <>
              <div className="w-8 h-8 border-2 border-[#F0E4E0] border-t-gray-600 rounded-full animate-spin" />
              <span className="text-sm text-[#B8A099]">上传中...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-[#B8A099]" />
              <span className="text-sm text-[#B8A099]">{label}</span>
              {!isSquare && <span className="text-xs text-[#B8A099]">支持 JPG、PNG、WebP，最大 10MB</span>}
            </>
          )}
        </button>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

