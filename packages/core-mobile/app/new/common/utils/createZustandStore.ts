import { create } from 'zustand'
import { persist, PersistOptions } from 'zustand/middleware'
import { zustandMMKVStorage } from 'utils/mmkv/storages'

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
 *
 * // For non-React contexts (e.g., Redux listeners, utilities):
 * useCounter.setState(10)
 * useCounter.getState() // returns 10
 * ```
 */
type Updater<T> = T | ((curr: T) => T)

type StoreState<T> = {
  value: T
  setValue: (next: Updater<T>) => void
}

type CreateZustandStoreOptions<T> = {
  persist?: PersistOptions<StoreState<T>, { value: T }>
}

export function createZustandStore<T>(
  initialValue: T,
  options?: CreateZustandStoreOptions<T>
): (() => readonly [T, (next: Updater<T>) => void]) & {
  setState: (next: Updater<T>) => void
  getState: () => T
} {
  const createState = (
    set: (next: (state: StoreState<T>) => Partial<StoreState<T>>) => void
  ): StoreState<T> => ({
    value: initialValue,
    setValue: next =>
      set(state => ({
        value:
          typeof next === 'function'
            ? (next as (curr: T) => T)(state.value)
            : next
      }))
  })

  const useInner = options?.persist
    ? create<StoreState<T>>()(
        persist(createState, {
          ...options.persist,
          storage:
            options.persist.storage ??
            (zustandMMKVStorage as unknown as NonNullable<
              PersistOptions<StoreState<T>, { value: T }>['storage']
            >),
          partialize:
            options.persist.partialize ?? (state => ({ value: state.value }))
        })
      )
    : create<StoreState<T>>(createState)

  const useHook = (): [T, (next: Updater<T>) => void] => {
    const value = useInner(s => s.value)
    const setValue = useInner(s => s.setValue)
    return [value, setValue] as const
  }

  // Expose setState and getState for non-React contexts
  useHook.setState = (next: Updater<T>) => {
    useInner.getState().setValue(next)
  }

  useHook.getState = () => {
    return useInner.getState().value
  }

  return useHook
}
