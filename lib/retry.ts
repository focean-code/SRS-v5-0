interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
  onRetry?: (attempt: number, error: Error) => void
}

export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2, onRetry } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxAttempts) {
        throw lastError
      }

      if (onRetry) {
        onRetry(attempt, lastError)
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
