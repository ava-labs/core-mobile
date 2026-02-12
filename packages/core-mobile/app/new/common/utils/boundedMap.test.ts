import { BoundedMap } from './boundedMap'

describe('BoundedMap', () => {
  describe('basic Map functionality', () => {
    it('should set and get values', () => {
      const map = new BoundedMap<string, number>(3)
      map.set('a', 1)
      map.set('b', 2)

      expect(map.get('a')).toBe(1)
      expect(map.get('b')).toBe(2)
      expect(map.get('c')).toBeUndefined()
    })

    it('should check if keys exist', () => {
      const map = new BoundedMap<string, number>(3)
      map.set('a', 1)

      expect(map.has('a')).toBe(true)
      expect(map.has('b')).toBe(false)
    })

    it('should track size correctly', () => {
      const map = new BoundedMap<string, number>(3)

      expect(map.size).toBe(0)
      map.set('a', 1)
      expect(map.size).toBe(1)
      map.set('b', 2)
      expect(map.size).toBe(2)
    })

    it('should delete entries', () => {
      const map = new BoundedMap<string, number>(3)
      map.set('a', 1)
      map.set('b', 2)

      expect(map.delete('a')).toBe(true)
      expect(map.has('a')).toBe(false)
      expect(map.size).toBe(1)
      expect(map.delete('a')).toBe(false)
    })
  })

  describe('FIFO eviction behavior', () => {
    it('should evict oldest entry when maxSize is reached', () => {
      const map = new BoundedMap<string, number>(3)

      map.set('a', 1)
      map.set('b', 2)
      map.set('c', 3)
      expect(map.size).toBe(3)
      expect(map.has('a')).toBe(true)

      // Adding 4th entry should evict 'a' (oldest)
      map.set('d', 4)
      expect(map.size).toBe(3)
      expect(map.has('a')).toBe(false)
      expect(map.has('b')).toBe(true)
      expect(map.has('c')).toBe(true)
      expect(map.has('d')).toBe(true)
    })

    it('should continue evicting in FIFO order', () => {
      const map = new BoundedMap<string, number>(2)

      map.set('a', 1)
      map.set('b', 2)
      map.set('c', 3) // evicts 'a'
      map.set('d', 4) // evicts 'b'

      expect(map.has('a')).toBe(false)
      expect(map.has('b')).toBe(false)
      expect(map.has('c')).toBe(true)
      expect(map.has('d')).toBe(true)
      expect(map.size).toBe(2)
    })

    it('should NOT refresh position when updating existing key', () => {
      const map = new BoundedMap<string, number>(3)

      map.set('a', 1)
      map.set('b', 2)
      map.set('c', 3)

      // Update 'a' (oldest) - does NOT move it to the end in FIFO
      map.set('a', 10)

      // Adding 'd' should still evict 'a' (oldest by insertion order)
      map.set('d', 4)

      expect(map.has('a')).toBe(false) // 'a' was evicted despite being updated
      expect(map.get('b')).toBe(2)
      expect(map.get('c')).toBe(3)
      expect(map.get('d')).toBe(4)
    })

    it('should update value without changing eviction order', () => {
      const map = new BoundedMap<string, string>(2)

      map.set('first', 'v1')
      map.set('second', 'v2')

      // Update first entry's value
      map.set('first', 'updated')
      expect(map.get('first')).toBe('updated')

      // Adding third entry should evict 'first' (still oldest)
      map.set('third', 'v3')

      expect(map.has('first')).toBe(false)
      expect(map.has('second')).toBe(true)
      expect(map.has('third')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle maxSize of 1', () => {
      const map = new BoundedMap<string, number>(1)

      map.set('a', 1)
      expect(map.size).toBe(1)

      map.set('b', 2)
      expect(map.size).toBe(1)
      expect(map.has('a')).toBe(false)
      expect(map.has('b')).toBe(true)
    })

    it('should handle updating the only entry when maxSize is 1', () => {
      const map = new BoundedMap<string, number>(1)

      map.set('a', 1)
      map.set('a', 2)

      expect(map.size).toBe(1)
      expect(map.get('a')).toBe(2)
    })

    it('should handle different key types', () => {
      const map = new BoundedMap<number, string>(2)

      map.set(1, 'one')
      map.set(2, 'two')
      map.set(3, 'three')

      expect(map.has(1)).toBe(false)
      expect(map.get(2)).toBe('two')
      expect(map.get(3)).toBe('three')
    })

    it('should maintain correct iteration order', () => {
      const map = new BoundedMap<string, number>(3)

      map.set('a', 1)
      map.set('b', 2)
      map.set('c', 3)

      const keys = Array.from(map.keys())
      expect(keys).toEqual(['a', 'b', 'c'])

      // After eviction, order should be preserved
      map.set('d', 4)
      const keysAfterEviction = Array.from(map.keys())
      expect(keysAfterEviction).toEqual(['b', 'c', 'd'])
    })
  })
})
