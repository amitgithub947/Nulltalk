"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Category =
  | "LOVE_RELATIONSHIPS"
  | "FAMILY_FRIENDS"
  | "WORK_SCHOOL"
  | "SECRETS_LIES"
  | "REGRETS_MISTAKES"
  | "DREAMS_ASPIRATIONS"
  | "FEARS_ANXIETIES"
  | "GUILT_SHAME"
  | "ANGER_FRUSTRATION"
  | "GRATITUDE_THANKS"
  | "CONFUSION_DOUBT"
  | "LONELINESS_ISOLATION"
  | "SUCCESS_ACHIEVEMENT"
  | "FAILURE_DISAPPOINTMENT"
  | "OTHER";

const categories = [
  { value: "LOVE_RELATIONSHIPS", label: "💕 Love & Relationships", color: "from-pink-500 to-rose-500" },
  { value: "FAMILY_FRIENDS", label: "👨‍👩‍👧‍👦 Family & Friends", color: "from-blue-500 to-cyan-500" },
  { value: "WORK_SCHOOL", label: "💼 Work & School", color: "from-indigo-500 to-blue-500" },
  { value: "SECRETS_LIES", label: "🤫 Secrets & Lies", color: "from-purple-500 to-pink-500" },
  { value: "REGRETS_MISTAKES", label: "😔 Regrets & Mistakes", color: "from-gray-500 to-slate-500" },
  { value: "DREAMS_ASPIRATIONS", label: "✨ Dreams & Aspirations", color: "from-yellow-500 to-orange-500" },
  { value: "FEARS_ANXIETIES", label: "😰 Fears & Anxieties", color: "from-red-500 to-orange-500" },
  { value: "GUILT_SHAME", label: "😞 Guilt & Shame", color: "from-slate-500 to-gray-500" },
  { value: "ANGER_FRUSTRATION", label: "😠 Anger & Frustration", color: "from-red-600 to-red-500" },
  { value: "GRATITUDE_THANKS", label: "🙏 Gratitude & Thanks", color: "from-green-500 to-emerald-500" },
  { value: "CONFUSION_DOUBT", label: "🤔 Confusion & Doubt", color: "from-amber-500 to-yellow-500" },
  { value: "LONELINESS_ISOLATION", label: "😢 Loneliness & Isolation", color: "from-blue-600 to-indigo-600" },
  { value: "SUCCESS_ACHIEVEMENT", label: "🎉 Success & Achievement", color: "from-green-500 to-teal-500" },
  { value: "FAILURE_DISAPPOINTMENT", label: "😞 Failure & Disappointment", color: "from-gray-600 to-slate-600" },
  { value: "OTHER", label: "📝 Other", color: "from-zinc-500 to-gray-500" },
];

export default function PostPage() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("OTHER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    limit: number;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim() || content.trim().length < 5) {
      setError("Content must be at least 5 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/confession", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, category }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update rate limit info if provided
        if (data.rateLimit) {
          setRateLimitInfo({
            remaining: data.rateLimit.remaining,
            limit: data.rateLimit.limit,
          });
        }
        setShowSuccess(true);
        setContent("");
        setTimeout(() => {
          router.push("/feed");
        }, 2000);
      } else {
        // Handle rate limit errors specifically
        if (response.status === 429) {
          setError(data.message || data.error || "Rate limit exceeded");
          if (data.rateLimit) {
            setRateLimitInfo({
              remaining: 0,
              limit: data.rateLimit.limit,
            });
          }
        } else {
          setError(data.error || "Failed to post confession");
        }
      }
    } catch (error) {
      console.error("Error posting confession:", error);
      setError("Failed to post confession. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.value === category);

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
                href="/feed"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Feed
              </Link>
              <Link
                href="/trending"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Trending
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-green-800 dark:text-green-200 font-medium">Confession posted successfully!</p>
              <p className="text-green-600 dark:text-green-400 text-sm">Redirecting to feed...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 font-medium mb-1">{error}</p>
                {rateLimitInfo && rateLimitInfo.remaining === 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    You can post {rateLimitInfo.limit} confessions per hour. Please wait before posting again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Share Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Confession</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Express yourself freely and anonymously. Your words will be heard.
          </p>
        </div>

        {/* Post Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content Textarea */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-zinc-900 dark:text-zinc-50">
                Your Confession
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write what's on your mind... (minimum 5 characters)"
                className="w-full px-4 py-3 border-2 border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={8}
                required
                minLength={5}
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {content.length < 5 ? `${5 - content.length} more characters needed` : "✓ Ready to post"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {content.length} / 2000
                </p>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-zinc-900 dark:text-zinc-50">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value as Category)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      category === cat.value
                        ? `border-blue-500 bg-gradient-to-br ${cat.color} text-white shadow-lg scale-105`
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Category Badge */}
            {selectedCategory && (
              <div className={`p-4 rounded-xl bg-gradient-to-r ${selectedCategory.color} text-white`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCategory.label.split(" ")[0]}</span>
                  <span className="font-medium">{selectedCategory.label.substring(selectedCategory.label.indexOf(" ") + 1)}</span>
                </div>
              </div>
            )}

            {/* Rate Limit Info */}
            {rateLimitInfo && rateLimitInfo.remaining > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">{rateLimitInfo.remaining}</span> of {rateLimitInfo.limit} confessions remaining this hour
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || content.trim().length < 5 || (rateLimitInfo?.remaining === 0)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Post Confession</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Privacy & Moderation</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your confession is completely anonymous. All posts are automatically moderated for inappropriate content. 
                Posts with profanity may require manual approval before appearing in the feed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

