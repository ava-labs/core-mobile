import { createMMKV } from 'react-native-mmkv'
import { PersistStorage, StateStorage, StorageValue } from 'zustand/middleware'

// ---------- common storage ----------

export const commonStorage = createMMKV({
  id: `common`
})

// ---------- query storage ----------

export const queryStorage = createMMKV({
  id: `query`
})

// ---------- migration storage ----------

/**
 * Dedicated storage for the listener migration system. Isolating the
 * tracking blob from `commonStorage` keeps migration state from competing
 * with unrelated keys for serialization slots and makes it easy to inspect
 * or clear independently.
 */
export const migrationStorage = createMMKV({
  id: `migration`
})

// ---------- zustand storage ----------

export const zustandStorageMMKV = createMMKV({
  id: `zustand`
})

/**
 * Simple Zustand persist adapter backed by `zustandStorageMMKV`. Each
 * persisted Zustand store keys into this same MMKV instance under its
 * configured `name` (a `ZustandStorageKeys` value).
 */
export const zustandPersistStorage: PersistStorage<StateStorage> = {
  getItem: (name: string) => {
    const value = zustandStorageMMKV.getString(name)
    return value ? JSON.parse(value) : null
  },
  setItem: (name: string, value: StorageValue<StateStorage>) => {
    zustandStorageMMKV.set(name, JSON.stringify(value))
  },
  removeItem: (name: string) => {
    zustandStorageMMKV.remove(name)
  }
}
