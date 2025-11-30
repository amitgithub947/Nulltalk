"use client";

import { useEffect, useState, useRef } from "react";
import ConfessionCard from "../components/ConfessionCard";
import Link from "next/link";

type Confession = {
  id: string;
  content: string;
  category: string | null;
  sentiment: number | null;
  createdAt: string;
  anonId: string;
};

const SWIPED_IDS_STORAGE = "swiped_confession_ids";

export default function FeedPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
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
          setSwipedIds((prev) => {
            const combined = new Set([...prev, ...votedConfessionIds]);
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

  // Load existing confessions from database
  useEffect(() => {
    const timer = setTimeout(() => {
      const loadExistingConfessions = async () => {
        try {
          const response = await fetch(`/api/confessions?limit=50`);
          const data = await response.json();

          if (response.ok && data.confessions) {
            const allSwipedIds = new Set([...swipedIds, ...votedIds]);
            const filteredConfessions = data.confessions.filter(
              (c: Confession) => !allSwipedIds.has(c.id)
            );

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
    }, 100);

    return () => clearTimeout(timer);
  }, [swipedIds, votedIds]);

  // Connect to SSE endpoint
  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.addEventListener("connected", (e) => {
      const data = JSON.parse(e.data);
      console.log("[Client] Connected to SSE:", data);
      setConnectionStatus("connected");
    });

    eventSource.addEventListener("confession:new", (e) => {
      try {
        const newConfession = JSON.parse(e.data);
        console.log("[Client] New confession received:", newConfession);
        setConfessions((prev) => {
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

    eventSource.onerror = (error) => {
      console.error("[Client] SSE error:", error, eventSource.readyState);
      if (eventSource.readyState === EventSource.CLOSED) {
        setConnectionStatus("disconnected");
      } else {
        setConnectionStatus("connecting");
      }
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      setConnectionStatus("disconnected");
    };
  }, [swipedIds, votedIds]);

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
    const voteValue = direction === "right" ? 1 : -1;
    handleVote(confessionId, voteValue);

    setSwipedIds((prev) => {
      const updated = new Set(prev).add(confessionId);
      if (typeof window !== "undefined") {
        localStorage.setItem(SWIPED_IDS_STORAGE, JSON.stringify(Array.from(updated)));
      }
      return updated;
    });

    setVotedIds((prev) => new Set(prev).add(confessionId));
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

  const visibleConfessions = confessions
    .filter((c) => !swipedIds.has(c.id))
    .slice(0, 3);

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
                href="/post"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Post
              </Link>
              <Link
                href="/trending"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Trending
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Confession <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Feed</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Swipe through confessions and share your thoughts
          </p>
        </div>

        {/* Connection Status & Stats */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)} animate-pulse`} />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
              {connectionStatus}
            </span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">{confessions.filter((c) => !swipedIds.has(c.id)).length}</span> available
            </span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">{swipedIds.size}</span> swiped
            </span>
          </div>
        </div>

        {/* Card Stack */}
        <div className="relative">
          {visibleConfessions.length === 0 ? (
            <div className="relative h-[650px] bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-3xl border-2 border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col items-center justify-center p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">No More Confessions</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                  You've seen all available confessions. New ones will appear here in real-time!
                </p>
                <Link
                  href="/post"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post Your Own
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative h-[650px]">
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
        </div>
      </div>
    </div>
  );
}
