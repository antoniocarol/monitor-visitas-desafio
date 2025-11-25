import { memo } from "react";

export const Skeleton = memo(function Skeleton(): React.JSX.Element {
  return (
    <div className="w-full rounded-lg bg-white/5 p-4 backdrop-blur-sm border border-white/10 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-3/4 bg-white/10 rounded shimmer"></div>
          <div className="h-4 w-1/2 bg-white/10 rounded shimmer"></div>
        </div>
        <div className="h-6 w-16 bg-white/10 rounded-full shimmer"></div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-white/10 rounded shimmer"></div>
        <div className="h-3 w-5/6 bg-white/10 rounded shimmer"></div>
      </div>

      <div className="h-9 w-full bg-white/10 rounded shimmer"></div>
    </div>
  );
});

export const SkeletonList = memo(function SkeletonList({ count = 3 }: { count?: number }): React.JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
});
