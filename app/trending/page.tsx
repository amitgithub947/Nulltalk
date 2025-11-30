"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TrendingConfession = {
  id: string;
  content: string;
  category: string | null;
  sentiment: number | null;
  createdAt: string;
  anonId: string;
  upvotes: number;
  downvotes: number;
  trendingScore: number;
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

export default function TrendingPage() {
  const [trendingConfessions, setTrendingConfessions] = useState<TrendingConfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfession, setSelectedConfession] = useState<TrendingConfession | null>(null);

  // Load trending confessions
  useEffect(() => {
    const loadTrending = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/trending?limit=10");
        const data = await response.json();

        if (response.ok && data.confessions) {
          setTrendingConfessions(data.confessions.slice(0, 10)); // Ensure exactly 10
        }
      } catch (error) {
        console.error("Error loading trending confessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrending();
  }, []);

  const getSentimentEmoji = (sentiment: number | null) => {
    if (sentiment === null) return "😐";
    if (sentiment > 0.3) return "😊";
    if (sentiment < -0.3) return "😢";
    return "😐";
  };

  const formatCategory = (category: string | null) => {
    if (!category) return "Other";
    return category.replace(/_/g, " ");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-zinc-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">NullTalk</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/feed"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Feed
              </Link>
              <Link
                href="/post"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all text-sm shadow-lg"
              >
                + New Post
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Trending <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Confessions</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Top 10 most engaging confessions right now
          </p>
        </div>

        {/* Trending List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-zinc-600 dark:text-zinc-400">Loading trending confessions...</p>
            </div>
          </div>
        ) : trendingConfessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">No Trending Confessions Yet</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Check back later for trending content
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trendingConfessions.map((confession, index) => {
              const categoryColor = confession.category
                ? categoryColors[confession.category] || "from-zinc-500 to-gray-500"
                : "from-zinc-500 to-gray-500";

              return (
                <button
                  key={confession.id}
                  onClick={() => setSelectedConfession(confession)}
                  className="w-full text-left p-6 bg-white dark:bg-zinc-900 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-lg group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                          index === 0
                            ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                            : index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                            : index === 2
                            ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                            : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {confession.category && (
                          <span
                            className={`px-3 py-1 bg-gradient-to-r ${categoryColor} text-white text-xs font-semibold rounded-full`}
                          >
                            {formatCategory(confession.category)}
                          </span>
                        )}
                        <span className="text-2xl">{getSentimentEmoji(confession.sentiment)}</span>
                      </div>
                      <p className="text-zinc-800 dark:text-zinc-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {confession.content}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          <span className="text-sm font-semibold">{confession.upvotes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                          <span className="text-sm font-semibold">{confession.downvotes}</span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Score: {confession.trendingScore.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Modal */}
      {selectedConfession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedConfession(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient accent */}
            <div
              className={`h-2 bg-gradient-to-r ${
                selectedConfession.category
                  ? categoryColors[selectedConfession.category] || "from-zinc-500 to-gray-500"
                  : "from-zinc-500 to-gray-500"
              }`}
            />
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedConfession(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors z-10"
            >
              <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* Header Info */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{selectedConfession.anonId.slice(-2).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {selectedConfession.anonId}
                    </div>
                    <div className="text-2xl">{getSentimentEmoji(selectedConfession.sentiment)}</div>
                  </div>
                </div>
                <div className="text-right">
                  {selectedConfession.category && (
                    <span
                      className={`inline-block px-3 py-1 bg-gradient-to-r ${
                        categoryColors[selectedConfession.category] || "from-zinc-500 to-gray-500"
                      } text-white text-xs font-semibold rounded-full mb-2`}
                    >
                      {formatCategory(selectedConfession.category)}
                    </span>
                  )}
                  <div className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatDate(selectedConfession.createdAt)}
                  </div>
                </div>
              </div>

              {/* Full Content */}
              <div className="mb-6">
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-lg leading-relaxed">
                  {selectedConfession.content}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-6 border-t-2 border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedConfession.upvotes}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Upvotes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{selectedConfession.downvotes}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Downvotes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedConfession.trendingScore.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Trending Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
