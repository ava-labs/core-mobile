export function createCache<T>(key: string): {
  set: (data: T) => void
  get: () => T
} {
  let value: T | null = null

  return {
    set: (data: T) => {
      value = data
    },
    get: (): T => {
      if (!value) {
        throw new Error(`No ${key} params found`)
      }
      const data = value
      value = null // auto-clear after retrieval
      return data
    }
  }
}
