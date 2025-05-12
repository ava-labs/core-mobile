import { create } from 'zustand'

export function createZustandStore<T>(
  initialValue: T
): () => readonly [T, (next: T) => void] {
  const useInner = create<{ value: T; setValue: (next: T) => void }>(set => ({
    value: initialValue,
    setValue: next => set({ value: next })
  }))

  return () => {
    const value = useInner(s => s.value)
    const setValue = useInner(s => s.setValue)
    return [value, setValue]
  }
}
