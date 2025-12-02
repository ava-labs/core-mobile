type CacheEntry = {
  json: JSON
  expiry: number
  status: number
  headers: Headers
}

const debankCache = new Map<string, CacheEntry>()

// Helper to rebuild a Response object from JSON
const buildResponse = (entry: CacheEntry): Response => {
  return new Response(JSON.stringify(entry.json), {
    status: entry.status,
    headers: entry.headers
  })
}

/**
 * Enhances fetch with short-lived in-memory caching for DeBank requests.
 */
export const setupDeBankCaching = (): void => {
  const originalFetch = global.fetch

  // @ts-ignore
  global.fetch = async function debankCachedFetch(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString()

    // Only intercept Debank traffic
    const isDeBank = url.includes('/proxy/debank/')
    if (!isDeBank) {
      return originalFetch(input, init)
    }

    const cacheKey = url

    // Cache hit
    const entry = debankCache.get(cacheKey)
    if (entry && entry.expiry > Date.now()) {
      return buildResponse(entry)
    }

    // Cache miss → perform fetch
    const res = await originalFetch(input, init)

    // Attempt JSON parsing — some errors return HTML
    let json: JSON
    try {
      json = await res.clone().json()
    } catch {
      // don't cache non-JSON responses
      return res
    }

    // Cache result
    debankCache.set(cacheKey, {
      json,
      status: res.status,
      headers: res.headers,
      expiry: Date.now() + 30_000 // 30 seconds from now
    })

    return res
  }
}
