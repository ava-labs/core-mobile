// store/networkStore.ts
import { create, StoreApi, UseBoundStore } from 'zustand'

export function createStore<T>(initialValue: T): UseBoundStore<
  StoreApi<{
    value: T
    setValue: (n: T) => void
  }>
> {
  return create<{ value: T; setValue: (n: T) => void }>(set => ({
    value: initialValue,
    setValue: n => set({ value: n })
  }))
}
