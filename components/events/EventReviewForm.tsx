"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventReviewFormProps {
  eventId: string;
}

export function EventReviewForm({ eventId }: EventReviewFormProps) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (score < 1 || score > 5) {
      setError("请先打分（1-5星）");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "提交失败");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-center text-sm font-medium border border-green-100">
        感谢您的评价！您的反馈是我们前行的动力。
      </div>
    );
  }

  return (
    <div className="bg-[#FFF5F3]/30 border border-[#F0E4E0] rounded-2xl p-5 mb-6">
      <h3 className="text-[17px] font-semibold text-[#2D2420] mb-4">参与评价</h3>
      
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onMouseEnter={() => setHoverScore(star)}
            onMouseLeave={() => setHoverScore(0)}
            onClick={() => setScore(star)}
          >
            <Star
              className={`w-7 h-7 ${(hoverScore || score) >= star ? "fill-orange-400 text-orange-400" : "text-[#DED6D3]"}`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="写下你对本次聚餐的感受...（选填，最多300字）"
        maxLength={300}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-[#E8DCD8] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF2442]/20 focus:border-[#FF2442]/50 text-[#2D2420] placeholder-[#B8A099] resize-none mb-3 text-[15px]"
      />

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={loading || score === 0}
          className="rounded-full bg-[#FF2442] hover:bg-[#FF4D63] text-white px-6"
        >
          {loading ? "提交中..." : "提交评价"}
        </Button>
      </div>
    </div>
  );
}
