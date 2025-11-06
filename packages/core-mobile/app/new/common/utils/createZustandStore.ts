import { create } from 'zustand'

/**
 * A lightweight utility for creating isolated Zustand stores that behave like `useState`
 * but can be shared across components.
 *
 * 🧩 Example:
 * ```ts
 * const useCounter = createZustandStore(0)
 *
 * function Counter() {
 *   const [count, setCount] = useCounter()
 *
 *   // You can set a value directly:
 *   // setCount(10)
 *
 *   // Or update it using the previous state:
 *   // setCount(prev => prev + 1)
 *
 *   return <button onClick={() => setCount(prev => prev + 1)}>Count: {count}</button>
 * }
 * ```
 */
export function createZustandStore<T>(
  initialValue: T
): () => readonly [T, (next: T | ((curr: T) => T)) => void] {
  const useInner = create<{
    value: T
    setValue: (next: T | ((curr: T) => T)) => void
  }>(set => ({
    value: initialValue,
    setValue: next =>
      set(state => ({
        value:
          typeof next === 'function'
            ? (next as (curr: T) => T)(state.value)
            : next
      }))
  }))

  return () => {
    const value = useInner(s => s.value)
    const setValue = useInner(s => s.setValue)
    return [value, setValue] as const
  }
}
