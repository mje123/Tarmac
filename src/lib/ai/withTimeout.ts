// A provider SDK's own `timeout`/`maxRetries` option is not a reliable fail-safe on
// its own — observed in practice to not bound a hung request in every runtime. This
// wraps any provider call in a hard deadline that rejects independently of whatever
// the underlying HTTP client is actually doing, so "provider is slow/hanging" always
// surfaces as a normal caught rejection (spec section 13) rather than blocking the
// caller indefinitely. The underlying request may keep running in the background after
// this rejects — acceptable here since the caller treats it as failed either way.
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      t.unref?.()
    }),
  ])
}
