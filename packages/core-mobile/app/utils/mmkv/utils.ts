import { MMKV } from 'react-native-mmkv'
import Logger from 'utils/Logger'

/**
 * JSON-stringifies an array and writes it under `key`. Errors are logged
 * but not thrown — callers shouldn't have to handle a broken stringify
 * for a well-typed value.
 */
export const saveArrayToStorage = <T>(
  storage: MMKV,
  key: string,
  value: T[]
): void => {
  try {
    storage.set(key, JSON.stringify(value))
  } catch (err) {
    Logger.error(`[MMKV:setArray] Failed to stringify ${key}`, err)
  }
}

/**
 * Reads and parses a JSON array previously written by `saveArrayToStorage`.
 * Returns `[]` if the key is missing or the stored value can't be parsed.
 */
export const loadArrayFromStorage = <T>(storage: MMKV, key: string): T[] => {
  try {
    const json = storage.getString(key)
    if (!json) return []
    return JSON.parse(json) as T[]
  } catch (err) {
    Logger.error(`[MMKV:getArray] Failed to parse ${key}`, err)
    return []
  }
}

/**
 * Loads the array at `key`, appends `item`, and writes it back. Returns
 * the new array.
 *
 * Not atomic across processes — callers in concurrent contexts should
 * synchronize externally.
 */
export const appendToStoredArray = <T>(
  storage: MMKV,
  key: string,
  item: T
): T[] => {
  const updated = [...loadArrayFromStorage<T>(storage, key), item]
  saveArrayToStorage(storage, key, updated)
  return updated
}
