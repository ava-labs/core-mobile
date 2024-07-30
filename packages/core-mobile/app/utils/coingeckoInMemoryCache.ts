import * as inMemoryCache from 'utils/InMemoryCache'

export const coingeckoInMemoryCache = {
  get: inMemoryCache.getCache,
  set: inMemoryCache.setCache
}
