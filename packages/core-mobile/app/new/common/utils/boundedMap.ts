export class BoundedMap<K, V> extends Map<K, V> {
  private readonly maxSize: number
  constructor(maxSize: number) {
    super()
    this.maxSize = maxSize
  }
  // Enforce a maximum size with simple LRU-style eviction based on insertion order.
  override set(key: K, value: V): this {
    if (!this.has(key) && this.size >= this.maxSize) {
      const oldestKey = this.keys().next().value as K | undefined
      if (oldestKey !== undefined) {
        this.delete(oldestKey)
      }
    }
    return super.set(key, value)
  }
}
