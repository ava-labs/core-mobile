import NodeCache from 'node-cache'

const ONE_MINUTE = 60
const cache = new NodeCache({ stdTTL: ONE_MINUTE })

export const getCache = <T>(cacheId: string) => {
  if (cache.has(cacheId)) {
    return cache.get<T>(cacheId)
  }

  return undefined
}

export const setCache = <T>(cacheId: string, data: T) =>
  cache.set<T>(cacheId, data)
