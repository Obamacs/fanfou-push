export default function Loading() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="relative aspect-[2/1] md:aspect-[3/1] bg-white/60 border border-[#F0E4E0]/40 rounded-3xl w-full" />
      
      {/* Title & Info Skeletons */}
      <div className="space-y-3">
        <div className="h-7 bg-gray-200/80 rounded-full w-1/3" />
        <div className="h-4 bg-gray-200/60 rounded-full w-1/4" />
      </div>

      {/* Grid Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="h-32 bg-white/70 border border-[#F0E4E0]/45 rounded-2xl w-full" />
        <div className="h-32 bg-white/70 border border-[#F0E4E0]/45 rounded-2xl w-full" />
      </div>
    </div>
  );
}
