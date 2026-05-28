import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-white animate-pulse">
      <Loader2 className="w-10 h-10 animate-spin text-[#FF2442] mb-4" />
      <p className="text-[#B8A099] text-sm font-medium tracking-wide">正在载入管理控制台...</p>
    </div>
  );
}
