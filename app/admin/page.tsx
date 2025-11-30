"use client";

import { useEffect, useState } from "react";
import Dialog from "../components/Dialog";
import ConfirmDialog from "../components/ConfirmDialog";

const ADMIN_KEY_STORAGE = "admin_access_key";

type PendingConfession = {
  id: string;
  confessionId: string;
  reason: string | null;
  createdAt: string;
  confession: {
    id: string;
    content: string;
    category: string | null;
    sentiment: number | null;
    createdAt: string;
    author: string | null;
  };
};

type Confession = {
  id: string;
  content: string;
  category: string | null;
  sentiment: number | null;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  downvotes: number;
  isDeleted: boolean;
  author: string | null;
  isPending: boolean;
};

export default function AdminPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessKey, setAccessKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [pendingConfessions, setPendingConfessions] = useState<PendingConfession[]>([]);
  const [allConfessions, setAllConfessions] = useState<Confession[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialog states
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning",
  });

  // Check for stored access key on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem(ADMIN_KEY_STORAGE);
      if (storedKey) {
        verifyKey(storedKey);
      } else {
        setHasAccess(false);
      }
    }
  }, []);

  const verifyKey = async (key: string) => {
    try {
      // Verify the key by making a test request
      const response = await fetch("/api/admin/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (response.ok) {
        localStorage.setItem(ADMIN_KEY_STORAGE, key);
        setHasAccess(true);
        setKeyError("");
      } else {
        localStorage.removeItem(ADMIN_KEY_STORAGE);
        setHasAccess(false);
        setKeyError("Invalid access key");
      }
    } catch (error) {
      console.error("Error verifying key:", error);
      setHasAccess(false);
      setKeyError("Failed to verify key");
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError("");
    if (accessKey.length !== 32) {
      setKeyError("Access key must be 32 characters long");
      return;
    }
    verifyKey(accessKey);
  };

  const fetchPending = async () => {
    try {
      const response = await fetch("/api/admin/pending");
      const data = await response.json();
      setPendingConfessions(data.pending || []);
    } catch (error) {
      console.error("Error fetching pending:", error);
    }
  };

  const fetchAll = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/confessions?page=${pageNum}&limit=20`);
      const data = await response.json();
      setAllConfessions(data.confessions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching confessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPending();
    } else {
      fetchAll();
    }
  }, [activeTab]);

  const handleApprove = async (confessionId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Approve Confession",
      message: "Are you sure you want to approve this confession?",
      type: "info",
      onConfirm: async () => {
        try {
          const response = await fetch("/api/admin/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confessionId }),
          });

          if (response.ok) {
            setDialog({
              isOpen: true,
              type: "success",
              title: "Success",
              message: "Confession approved and broadcasted!",
            });
            fetchPending();
            if (activeTab === "all") {
              fetchAll(page);
            }
          } else {
            const data = await response.json();
            setDialog({
              isOpen: true,
              type: "error",
              title: "Error",
              message: data.error || "Failed to approve confession",
            });
          }
        } catch (error) {
          console.error("Error approving confession:", error);
          setDialog({
            isOpen: true,
            type: "error",
            title: "Error",
            message: "Failed to approve confession",
          });
        }
      },
    });
  };

  const handleDelete = async (confessionId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Confession",
      message: "Are you sure you want to delete this confession? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        try {
          const response = await fetch("/api/admin/confessions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confessionId }),
          });

          if (response.ok) {
            setDialog({
              isOpen: true,
              type: "success",
              title: "Success",
              message: "Confession deleted successfully!",
            });
            if (activeTab === "pending") {
              fetchPending();
            } else {
              fetchAll(page);
            }
          } else {
            const data = await response.json();
            setDialog({
              isOpen: true,
              type: "error",
              title: "Error",
              message: data.error || "Failed to delete confession",
            });
          }
        } catch (error) {
          console.error("Error deleting confession:", error);
          setDialog({
            isOpen: true,
            type: "error",
            title: "Error",
            message: "Failed to delete confession",
          });
        }
      },
    });
  };

  const getSentimentEmoji = (sentiment: number | null) => {
    if (sentiment === null) return "😐";
    if (sentiment > 0.3) return "😊";
    if (sentiment < -0.3) return "😢";
    return "😐";
  };

  // Show key entry form if no access
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-2 text-black dark:text-zinc-50 text-center">
              Admin Access
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
              Enter your 32-character access key
            </p>
            <form onSubmit={handleKeySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Access Key
                </label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter 32-character key"
                  maxLength={32}
                  required
                  autoFocus
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {accessKey.length}/32 characters
                </p>
              </div>
              {keyError && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {keyError}
                </div>
              )}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Access Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking access
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-zinc-50">
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-zinc-300 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "pending"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
            }`}
          >
            Pending Moderation ({pendingConfessions.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
            }`}
          >
            All Confessions
          </button>
        </div>

        {/* Pending Confessions Tab */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingConfessions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-lg shadow">
                No pending confessions to review.
              </div>
            ) : (
              pendingConfessions.map((item) => (
                <div
                  key={item.id}
                  className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                          {item.confession.author || "Anonymous"}
                        </span>
                        <span className="text-2xl">
                          {getSentimentEmoji(item.confession.sentiment)}
                        </span>
                        {item.confession.category && (
                          <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                            {item.confession.category.replace(/_/g, " ")}
                          </span>
                        )}
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                          {item.reason || "Pending Review"}
                        </span>
                      </div>
                      <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap mb-2">
                        {item.confession.content}
                      </p>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(item.confession.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(item.confessionId)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDelete(item.confessionId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All Confessions Tab */}
        {activeTab === "all" && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                Loading...
              </div>
            ) : allConfessions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-lg shadow">
                No confessions found.
              </div>
            ) : (
              <>
                {allConfessions.map((confession) => (
                  <div
                    key={confession.id}
                    className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                            {confession.author || "Anonymous"}
                          </span>
                          <span className="text-2xl">
                            {getSentimentEmoji(confession.sentiment)}
                          </span>
                          {confession.category && (
                            <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                              {confession.category.replace(/_/g, " ")}
                            </span>
                          )}
                          {confession.isPending && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded text-yellow-800 dark:text-yellow-200">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap mb-2">
                          {confession.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>{new Date(confession.createdAt).toLocaleString()}</span>
                          <span>↑ {confession.upvotes}</span>
                          <span>↓ {confession.downvotes}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {confession.isPending && (
                        <button
                          onClick={() => handleApprove(confession.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(confession.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => fetchAll(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchAll(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Dialog Components */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
}

