import * as inMemoryCache from 'utils/InMemoryCache'

export const tokenServiceInMemoryCache = {
  get: inMemoryCache.getCache,
  set: inMemoryCache.setCache
}
