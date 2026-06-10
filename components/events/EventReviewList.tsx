"use client";

import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import Image from "next/image";

interface Review {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
  };
}

export function EventReviewList({ eventId }: { eventId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) setReviews(data.reviews);
      })
      .catch((err) => console.error("Failed to fetch reviews", err))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded-2xl mb-8"></div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white border border-[#F0E4E0] rounded-2xl p-8 text-center mb-8">
        <p className="text-[#B8A099] text-sm">暂无活动评价，期待你的第一条留言</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-[19px] font-semibold text-[#2D2420] mb-4">
        活动评价 ({reviews.length})
      </h3>
      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-[#F0E4E0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#FFF5F3] flex items-center justify-center flex-shrink-0">
                {review.user.avatarUrl ? (
                  <Image src={review.user.avatarUrl} alt={review.user.name} width={40} height={40} className="object-cover" />
                ) : (
                  <User className="w-5 h-5 text-[#B8A099]" />
                )}
              </div>
              <div>
                <div className="text-[15px] font-medium text-[#2D2420]">{review.user.name}</div>
                <div className="text-[11px] text-[#B8A099]">
                  {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                </div>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${review.score >= star ? "fill-orange-400 text-orange-400" : "text-[#DED6D3]"}`}
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-[14px] text-[#2D2420] leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
