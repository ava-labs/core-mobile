import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type { Frequency, NumberOfOrders } from '../types'

type State = {
  isRecurring: boolean
  setIsRecurring: (v: boolean) => void
  frequency: Frequency | undefined
  setFrequency: (f: Frequency | undefined) => void
  numberOfOrders: NumberOfOrders | undefined
  setNumberOfOrders: (n: NumberOfOrders | undefined) => void
}

const Ctx = createContext<State | null>(null)

export function RecurringSwapContextProvider({
  children
}: {
  children: ReactNode
}): JSX.Element {
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<Frequency | undefined>(undefined)
  const [numberOfOrders, setNumberOfOrders] = useState<
    NumberOfOrders | undefined
  >(undefined)

  const value = useMemo<State>(
    () => ({
      isRecurring,
      setIsRecurring,
      frequency,
      setFrequency,
      numberOfOrders,
      setNumberOfOrders
    }),
    [isRecurring, frequency, numberOfOrders]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRecurringSwapContext(): State {
  const v = useContext(Ctx)
  if (!v) {
    throw new Error(
      'useRecurringSwapContext must be used within a RecurringSwapContextProvider'
    )
  }
  return v
}
