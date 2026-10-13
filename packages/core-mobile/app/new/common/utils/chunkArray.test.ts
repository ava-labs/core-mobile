import { chunkArray } from './chunkArray'

describe('chunkArray', () => {
  describe('invalid sizes', () => {
    // 0 and negatives would hang rather than fail; the rest silently
    // produce misshapen chunks. Both are worse than throwing.
    it.each([0, -1, -500, NaN, Infinity, -Infinity, 2.5])(
      'throws for a size of %p',
      size => {
        expect(() => chunkArray([1, 2, 3], size)).toThrow(
          /size must be a positive integer/
        )
      }
    )

    it('throws before touching the array, even when it is empty', () => {
      expect(() => chunkArray([], 0)).toThrow(/size must be a positive integer/)
    })

    it('names the offending value in the message', () => {
      expect(() => chunkArray([1], 0)).toThrow('got 0')
    })
  })

  it('returns no chunks for an empty array', () => {
    expect(chunkArray([], 3)).toEqual([])
  })

  it('returns a single chunk when the size exceeds the array length', () => {
    expect(chunkArray([1, 2, 3], 10)).toEqual([[1, 2, 3]])
  })

  it('returns one chunk per element for a size of 1', () => {
    expect(chunkArray([1, 2, 3], 1)).toEqual([[1], [2], [3]])
  })

  it('splits evenly with no trailing empty chunk when the length is a multiple of the size', () => {
    const chunks = chunkArray([1, 2, 3, 4, 5, 6], 3)

    expect(chunks).toEqual([
      [1, 2, 3],
      [4, 5, 6]
    ])
    expect(chunks).toHaveLength(2)
  })

  it('puts the remainder in a short final chunk', () => {
    expect(chunkArray([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7]
    ])
  })

  it('never produces an empty chunk', () => {
    for (let length = 0; length <= 20; length++) {
      const input = Array.from({ length }, (_, i) => i)

      for (let size = 1; size <= 7; size++) {
        const chunks = chunkArray(input, size)

        chunks.forEach(chunk => expect(chunk.length).toBeGreaterThan(0))
      }
    }
  })

  it('preserves every element exactly once, in order', () => {
    const input = Array.from({ length: 1200 }, (_, i) => i)

    expect(chunkArray(input, 500).flat()).toEqual(input)
  })

  it('caps every chunk at the requested size', () => {
    const chunks = chunkArray(
      Array.from({ length: 1200 }, (_, i) => i),
      500
    )

    expect(chunks.map(chunk => chunk.length)).toEqual([500, 500, 200])
  })

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5]
    const before = [...input]

    chunkArray(input, 2)

    expect(input).toEqual(before)
  })

  it('carries element references rather than copies', () => {
    const a = { id: 'a' }
    const b = { id: 'b' }

    const chunks = chunkArray([a, b], 1)

    expect(chunks[0]?.[0]).toBe(a)
    expect(chunks[1]?.[0]).toBe(b)
  })

  it('chunks a single-element array', () => {
    expect(chunkArray(['only'], 500)).toEqual([['only']])
  })
})
