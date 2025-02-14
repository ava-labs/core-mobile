import { LRUCache } from 'lru-cache'

const ONE_MINUTE = 60 * 1000
const cache = new LRUCache<string, object>({
  ttl: ONE_MINUTE,
  ttlAutopurge: true
})

export const getCache = <T>(cacheId: string): T | undefined => {
  if (cache.has(cacheId)) {
    return cache.get(cacheId) as T
  }

  return undefined
}

export const setCache = <T>(cacheId: string, data: T): void => {
  cache.set(cacheId, data as object)
}
