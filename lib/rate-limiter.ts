// lib/rate-limiter.ts
// Simple in-memory rate limiter
// For production, consider using Redis or a database-backed solution

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
};

type RateLimitEntry = {
  count: number;
  resetTime: number; // Timestamp when the window resets
};

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request should be allowed
   * @param identifier - Unique identifier (e.g., sessionId, IP address)
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No entry or window expired - create new entry
    if (!entry || now >= entry.resetTime) {
      const resetTime = now + this.config.windowMs;
      this.requests.set(identifier, {
        count: 1,
        resetTime,
      });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
      };
    }

    // Window still active
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.requests.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [identifier, entry] of this.requests.entries()) {
      if (now >= entry.resetTime) {
        this.requests.delete(identifier);
      }
    }
  }

  /**
   * Reset rate limit for a specific identifier (useful for testing or admin actions)
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Get current rate limit status for an identifier
   */
  getStatus(identifier: string): {
    count: number;
    remaining: number;
    resetTime: number;
  } | null {
    const entry = this.requests.get(identifier);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now >= entry.resetTime) {
      return null; // Window expired
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }
}

// Create rate limiter instances
// Configuration: 5 posts per hour per user
export const confessionRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
});

// Optional: Different rate limits for different actions
// export const voteRateLimiter = new RateLimiter({
//   maxRequests: 100,
//   windowMs: 60 * 60 * 1000, // 1 hour
// });
