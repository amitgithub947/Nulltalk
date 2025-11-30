"use client";

import { useState, useEffect, useRef } from "react";

type Confession = {
  id: string;
  content: string;
  category: string | null;
  sentiment: number | null;
  createdAt: string;
  anonId: string;
};

type ConfessionCardProps = {
  confession: Confession;
  onSwipe: (direction: "left" | "right") => void;
  index: number;
};

const categoryColors: Record<string, string> = {
  "LOVE_RELATIONSHIPS": "from-pink-500 to-rose-500",
  "FAMILY_FRIENDS": "from-blue-500 to-cyan-500",
  "WORK_SCHOOL": "from-indigo-500 to-blue-500",
  "SECRETS_LIES": "from-purple-500 to-pink-500",
  "REGRETS_MISTAKES": "from-gray-500 to-slate-500",
  "DREAMS_ASPIRATIONS": "from-yellow-500 to-orange-500",
  "FEARS_ANXIETIES": "from-red-500 to-orange-500",
  "GUILT_SHAME": "from-slate-500 to-gray-500",
  "ANGER_FRUSTRATION": "from-red-600 to-red-500",
  "GRATITUDE_THANKS": "from-green-500 to-emerald-500",
  "CONFUSION_DOUBT": "from-amber-500 to-yellow-500",
  "LONELINESS_ISOLATION": "from-blue-600 to-indigo-600",
  "SUCCESS_ACHIEVEMENT": "from-green-500 to-teal-500",
  "FAILURE_DISAPPOINTMENT": "from-gray-600 to-slate-600",
  "OTHER": "from-zinc-500 to-gray-500",
};

export default function ConfessionCard({ confession, onSwipe, index }: ConfessionCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [offset, setOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100;
  const ROTATION_FACTOR = 0.1;

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setCurrentX(clientX);
    setOffset(diff);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      onSwipe(offset > 0 ? "right" : "left");
    } else {
      setOffset(0);
      setCurrentX(0);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onMouseUp = () => {
    handleEnd();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startX, offset]);

  const rotation = offset * ROTATION_FACTOR;
  const opacity = index === 0 ? 1 : Math.max(0.3, 1 - index * 0.2);
  const scale = index === 0 ? 1 : Math.max(0.85, 1 - index * 0.05);
  const translateY = index * 8;

  const getSentimentEmoji = (sentiment: number | null) => {
    if (sentiment === null) return "😐";
    if (sentiment > 0.3) return "😊";
    if (sentiment < -0.3) return "😢";
    return "😐";
  };

  const categoryColor = confession.category ? categoryColors[confession.category] || "from-zinc-500 to-gray-500" : "from-zinc-500 to-gray-500";
  const categoryLabel = confession.category ? confession.category.replace(/_/g, " ") : "Other";

  return (
    <div
      ref={cardRef}
      className="absolute w-full h-full transition-all duration-300 ease-out cursor-grab active:cursor-grabbing"
      style={{
        transform: `translateX(${offset}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
        opacity,
        zIndex: 100 - index,
        pointerEvents: index === 0 ? "auto" : "none",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="h-full bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-3xl shadow-2xl border-2 border-zinc-200 dark:border-zinc-800 p-8 flex flex-col relative overflow-hidden">
        {/* Gradient Accent */}
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${categoryColor}`} />

        {/* Swipe indicators with better styling */}
        {Math.abs(offset) > 50 && (
          <div
            className={`absolute inset-0 flex items-center justify-center text-7xl font-bold rounded-3xl backdrop-blur-sm transition-all ${
              offset > 0
                ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 text-green-600 dark:text-green-400"
                : "bg-gradient-to-br from-red-500/30 to-rose-500/30 text-red-600 dark:text-red-400"
            }`}
            style={{ zIndex: 1000 }}
          >
            <div className="flex flex-col items-center gap-2">
              <span>{offset > 0 ? "👍" : "👎"}</span>
              <span className="text-2xl font-bold">
                {offset > 0 ? "LIKE" : "PASS"}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{confession.anonId.slice(-2).toUpperCase()}</span>
            </div>
            <div>
              <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {confession.anonId}
              </div>
              <div className="text-2xl">{getSentimentEmoji(confession.sentiment)}</div>
            </div>
          </div>
          <div className="text-right">
            {confession.category && (
              <span className={`inline-block px-3 py-1 bg-gradient-to-r ${categoryColor} text-white text-xs font-semibold rounded-full shadow-md`}>
                {categoryLabel}
              </span>
            )}
            <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              {new Date(confession.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto mb-6">
          <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-xl leading-relaxed font-light">
            {confession.content}
          </p>
        </div>

        {/* Vote Buttons - Only show on top card */}
        {index === 0 && (
          <div className="flex gap-4 pt-6 border-t-2 border-zinc-200 dark:border-zinc-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwipe("left");
              }}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-rose-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <span className="text-2xl">👎</span>
              <span>Pass</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwipe("right");
              }}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <span className="text-2xl">👍</span>
              <span>Like</span>
            </button>
          </div>
        )}

        {/* Swipe hint for first card */}
        {index === 0 && Math.abs(offset) < 10 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-xs text-zinc-400 dark:text-zinc-500 animate-pulse">
            ← Swipe or click buttons →
          </div>
        )}
      </div>
    </div>
  );
}
