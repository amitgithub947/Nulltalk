"use client";

import { useEffect, useState, useRef } from "react";
import ConfessionCard from "./ConfessionCard";
import Link from "next/link";

type Confession = {
  id: string;
  content: string;
  category: string | null;
  sentiment: number | null;
  createdAt: string;
  anonId: string;
};

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

const SWIPED_IDS_STORAGE = "swiped_confession_ids";

export default function ConfessionTest() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("OTHER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load swiped IDs from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SWIPED_IDS_STORAGE);
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setSwipedIds(new Set(ids));
        } catch (error) {
          console.error("Error loading swiped IDs:", error);
        }
      }
    }
  }, []);

  // Load user's votes from server
  useEffect(() => {
    const loadUserVotes = async () => {
      try {
        const response = await fetch("/api/votes");
        if (response.ok) {
          const data = await response.json();
          const votedConfessionIds = new Set<string>(
            (data.votes?.map((v: { confessionId: string }) => v.confessionId) || []) as string[]
          );
          setVotedIds(votedConfessionIds);
          // Also add to swiped IDs so they don't show up
          setSwipedIds((prev) => {
            const combined = new Set([...prev, ...votedConfessionIds]);
            // Save to localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem(SWIPED_IDS_STORAGE, JSON.stringify(Array.from(combined)));
            }
            return combined;
          });
        }
      } catch (error) {
        console.error("Error loading user votes:", error);
      }
    };

    loadUserVotes();
  }, []);

  // Load existing confessions from database (after votes are loaded)
  useEffect(() => {
    // Wait a bit to ensure votes are loaded first
    const timer = setTimeout(() => {
      const loadExistingConfessions = async () => {
        try {
          const categoryParam = selectedCategoryFilter === "all" ? "" : `&category=${selectedCategoryFilter}`;
          const response = await fetch(`/api/confessions?limit=50${categoryParam}`);
          const data = await response.json();
          
          if (response.ok && data.confessions) {
            // Get current swiped/voted IDs
            const allSwipedIds = new Set([...swipedIds, ...votedIds]);
            
            // Filter out confessions that have been swiped/voted on
            const filteredConfessions = data.confessions.filter(
              (c: Confession) => !allSwipedIds.has(c.id)
            );
            
            // Add existing confessions, avoiding duplicates
            setConfessions((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const newConfessions = filteredConfessions.filter(
                (c: Confession) => !existingIds.has(c.id)
              );
              return [...prev, ...newConfessions];
            });
          }
        } catch (error) {
          console.error("Error loading existing confessions:", error);
        }
      };

      loadExistingConfessions();
    }, 100); // Small delay to ensure votes are loaded

    return () => clearTimeout(timer);
  }, [selectedCategoryFilter, swipedIds, votedIds]);

  // Connect to SSE endpoint
  useEffect(() => {
    const url = selectedCategoryFilter === "all" 
      ? "/api/events"
      : `/api/events?category=${selectedCategoryFilter}`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener("connected", (e) => {
      const data = JSON.parse(e.data);
      console.log("[Client] Connected to SSE:", data);
      setConnectionStatus("connected");
    });

    eventSource.addEventListener("confession:new", (e) => {
      try {
        const newConfession = JSON.parse(e.data);
        console.log("[Client] New confession received:", newConfession);
        // Only add if not already swiped or voted on
        setConfessions((prev) => {
          // Check if already in list, swiped, or voted on
          const exists = prev.some((c) => c.id === newConfession.id);
          const allSwipedIds = new Set([...swipedIds, ...votedIds]);
          if (exists || allSwipedIds.has(newConfession.id)) {
            return prev;
          }
          return [newConfession, ...prev];
        });
      } catch (error) {
        console.error("[Client] Error parsing confession:", error, e.data);
      }
    });

    // Listen for all events for debugging
    eventSource.onmessage = (e) => {
      console.log("[Client] SSE message (no event type):", e.data);
    };

    eventSource.onerror = (error) => {
      console.error("[Client] SSE error:", error, eventSource.readyState);
      // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      if (eventSource.readyState === EventSource.CLOSED) {
        setConnectionStatus("disconnected");
      } else {
        setConnectionStatus("connecting");
      }
      // EventSource will automatically reconnect
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      setConnectionStatus("disconnected");
    };
  }, [selectedCategoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      alert("Content must be at least 5 characters");
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
        console.log("Confession posted:", data);
        setContent("");
        alert(`Post submitted! Status: ${data.moderationStatus}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error posting confession:", error);
      alert("Failed to post confession");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (confessionId: string, value: 1 | -1) => {
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confessionId, value }),
      });

      if (!response.ok) {
        console.error("Failed to record vote");
      }
    } catch (error) {
      console.error("Error recording vote:", error);
    }
  };

  const handleSwipe = (confessionId: string, direction: "left" | "right") => {
    // Record vote before swiping
    const voteValue = direction === "right" ? 1 : -1;
    handleVote(confessionId, voteValue);

    // Mark as swiped and voted
    setSwipedIds((prev) => {
      const updated = new Set(prev).add(confessionId);
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(SWIPED_IDS_STORAGE, JSON.stringify(Array.from(updated)));
      }
      return updated;
    });
    
    setVotedIds((prev) => new Set(prev).add(confessionId));
    
    // Remove from confessions list
    setConfessions((prev) => prev.filter((c) => c.id !== confessionId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  // Get visible confessions (not swiped, show top 3 for stack effect)
  const visibleConfessions = confessions
    .filter((c) => !swipedIds.has(c.id))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
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
                href="/trending"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Trending
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Confession Feed
          </h1>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)}`} />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              SSE Status: <span className="capitalize">{connectionStatus}</span>
            </span>
            <span className="text-xs text-zinc-500">
              ({confessions.length} confessions received)
            </span>
          </div>
        </div>

        {/* Post Form */}
        <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
            Post a Confession
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your confession here (min 5 characters)..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
                minLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOVE_RELATIONSHIPS">Love & Relationships</option>
                <option value="FAMILY_FRIENDS">Family & Friends</option>
                <option value="WORK_SCHOOL">Work & School</option>
                <option value="SECRETS_LIES">Secrets & Lies</option>
                <option value="REGRETS_MISTAKES">Regrets & Mistakes</option>
                <option value="DREAMS_ASPIRATIONS">Dreams & Aspirations</option>
                <option value="FEARS_ANXIETIES">Fears & Anxieties</option>
                <option value="GUILT_SHAME">Guilt & Shame</option>
                <option value="ANGER_FRUSTRATION">Anger & Frustration</option>
                <option value="GRATITUDE_THANKS">Gratitude & Thanks</option>
                <option value="CONFUSION_DOUBT">Confusion & Doubt</option>
                <option value="LONELINESS_ISOLATION">Loneliness & Isolation</option>
                <option value="SUCCESS_ACHIEVEMENT">Success & Achievement</option>
                <option value="FAILURE_DISAPPOINTMENT">Failure & Disappointment</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || content.trim().length < 5}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Post Confession"}
            </button>
          </form>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            Filter by Category (SSE)
          </label>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="LOVE_RELATIONSHIPS">Love & Relationships</option>
            <option value="FAMILY_FRIENDS">Family & Friends</option>
            <option value="WORK_SCHOOL">Work & School</option>
            <option value="SECRETS_LIES">Secrets & Lies</option>
            <option value="REGRETS_MISTAKES">Regrets & Mistakes</option>
            <option value="DREAMS_ASPIRATIONS">Dreams & Aspirations</option>
            <option value="FEARS_ANXIETIES">Fears & Anxieties</option>
            <option value="GUILT_SHAME">Guilt & Shame</option>
            <option value="ANGER_FRUSTRATION">Anger & Frustration</option>
            <option value="GRATITUDE_THANKS">Gratitude & Thanks</option>
            <option value="CONFUSION_DOUBT">Confusion & Doubt</option>
            <option value="LONELINESS_ISOLATION">Loneliness & Isolation</option>
            <option value="SUCCESS_ACHIEVEMENT">Success & Achievement</option>
            <option value="FAILURE_DISAPPOINTMENT">Failure & Disappointment</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Tinder-like Card Stack */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
            Confessions
          </h2>
          
          {visibleConfessions.length === 0 ? (
            <div className="relative h-[600px] bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
              <div className="text-center text-zinc-500 dark:text-zinc-400">
                <p className="text-lg mb-2">No more confessions</p>
                <p className="text-sm">New confessions will appear here in real-time</p>
                <p className="text-xs mt-4">
                  Queue: {confessions.filter((c) => !swipedIds.has(c.id)).length} waiting
                </p>
              </div>
            </div>
          ) : (
            <div className="relative h-[600px]">
              {visibleConfessions.map((confession, index) => (
                <ConfessionCard
                  key={confession.id}
                  confession={confession}
                  onSwipe={(direction) => handleSwipe(confession.id, direction)}
                  index={index}
                />
              ))}
            </div>
          )}
          
          {/* Stats */}
          <div className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <span>Remaining: {confessions.filter((c) => !swipedIds.has(c.id)).length}</span>
            <span className="mx-2">•</span>
            <span>Swiped: {swipedIds.size}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

