import { MMKV } from 'react-native-mmkv'
import Logger from 'utils/Logger'
import {
  appendToStoredArray,
  loadArrayFromStorage,
  saveArrayToStorage
} from './utils'

/**
 * Lightweight in-memory MMKV stand-in. Only implements the methods used
 * by the array helpers.
 */
const createFakeStorage = (): MMKV => {
  const store = new Map<string, string>()
  return {
    getString: (k: string) => store.get(k),
    set: (k: string, v: string) => {
      store.set(k, v)
    },
    delete: (k: string) => {
      store.delete(k)
    }
  } as unknown as MMKV
}

const errorSpy = jest.spyOn(Logger, 'error').mockImplementation()

beforeEach(() => {
  errorSpy.mockClear()
})

describe('saveArrayToStorage', () => {
  it('writes a JSON-stringified array under the given key', () => {
    const storage = createFakeStorage()
    saveArrayToStorage(storage, 'k', ['a', 'b', 'c'])
    expect(storage.getString('k')).toBe('["a","b","c"]')
  })

  it('handles empty arrays', () => {
    const storage = createFakeStorage()
    saveArrayToStorage(storage, 'k', [])
    expect(storage.getString('k')).toBe('[]')
  })

  it('logs (does not throw) when stringify fails', () => {
    const storage = createFakeStorage()
    const circular: { self?: unknown } = {}
    circular.self = circular

    expect(() => saveArrayToStorage(storage, 'k', [circular])).not.toThrow()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to stringify k'),
      expect.anything()
    )
  })
})

describe('loadArrayFromStorage', () => {
  it('returns the parsed array when present', () => {
    const storage = createFakeStorage()
    storage.set('k', '["a","b"]')
    expect(loadArrayFromStorage<string>(storage, 'k')).toEqual(['a', 'b'])
  })

  it('returns [] when the key is missing', () => {
    const storage = createFakeStorage()
    expect(loadArrayFromStorage<string>(storage, 'missing')).toEqual([])
  })

  it('returns [] and logs when stored value is not valid JSON', () => {
    const storage = createFakeStorage()
    storage.set('k', 'not json')
    expect(loadArrayFromStorage<string>(storage, 'k')).toEqual([])
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse k'),
      expect.anything()
    )
  })

  it('round-trips with saveArrayToStorage', () => {
    const storage = createFakeStorage()
    saveArrayToStorage(storage, 'numbers', [1, 2, 3])
    expect(loadArrayFromStorage<number>(storage, 'numbers')).toEqual([1, 2, 3])
  })
})

describe('appendToStoredArray', () => {
  it('creates a new array when the key is empty', () => {
    const storage = createFakeStorage()
    const result = appendToStoredArray(storage, 'k', 'first')
    expect(result).toEqual(['first'])
    expect(loadArrayFromStorage<string>(storage, 'k')).toEqual(['first'])
  })

  it('appends to an existing array', () => {
    const storage = createFakeStorage()
    saveArrayToStorage(storage, 'k', ['a'])
    const result = appendToStoredArray(storage, 'k', 'b')
    expect(result).toEqual(['a', 'b'])
    expect(loadArrayFromStorage<string>(storage, 'k')).toEqual(['a', 'b'])
  })

  it('appends repeatedly', () => {
    const storage = createFakeStorage()
    appendToStoredArray(storage, 'k', 1)
    appendToStoredArray(storage, 'k', 2)
    appendToStoredArray(storage, 'k', 3)
    expect(loadArrayFromStorage<number>(storage, 'k')).toEqual([1, 2, 3])
  })

  it('does not mutate the previously-stored array reference', () => {
    const storage = createFakeStorage()
    const initial = ['a']
    saveArrayToStorage(storage, 'k', initial)
    appendToStoredArray(storage, 'k', 'b')
    expect(initial).toEqual(['a'])
  })
})
