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

export function createKeyedCache<T>(key: string): {
  set: (id: string, data: T) => void
  get: (id: string) => T
} {
  const map = new Map<string, T>()

  return {
    set: (id: string, data: T) => {
      map.set(id, data)
    },
    get: (id: string): T => {
      const data = map.get(id)
      if (!data) {
        throw new Error(`No ${key} params found for id ${id}`)
      }
      map.delete(id)
      return data
    }
  }
}
