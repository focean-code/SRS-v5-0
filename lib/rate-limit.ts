interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

interface RateLimitStore {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitStore>()

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60000, uniqueTokenPerInterval: 10 },
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now()
  const key = identifier

  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.interval,
    })

    return {
      success: true,
      remaining: config.uniqueTokenPerInterval - 1,
      reset: now + config.interval,
    }
  }

  if (record.count >= config.uniqueTokenPerInterval) {
    return {
      success: false,
      remaining: 0,
      reset: record.resetTime,
    }
  }

  record.count++

  return {
    success: true,
    remaining: config.uniqueTokenPerInterval - record.count,
    reset: record.resetTime,
  }
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
