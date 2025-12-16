import React, { createContext, ReactNode, useContext, useMemo } from 'react'
import { type Step } from 'services/earn/computeDelegationSteps/types'
import { useDelegation } from 'hooks/earn/useDelegation'

export type ComputeSteps = (stakeAmount: bigint) => Promise<Step[]>

type TransactionHash = string

export type Delegate = ({
  steps,
  startDate,
  endDate,
  nodeId
}: {
  steps: Step[]
  startDate: Date
  endDate: Date
  nodeId: string
}) => Promise<TransactionHash>

interface DelegationContextState {
  steps: Step[]
  computeSteps: ComputeSteps
  delegate: Delegate
}

export const DelegationContext = createContext<DelegationContextState>(
  {} as DelegationContextState
)

export const DelegationContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const { steps, computeSteps, delegate } = useDelegation()

  const state: DelegationContextState = useMemo(
    () => ({
      steps,
      computeSteps,
      delegate
    }),
    [computeSteps, delegate, steps]
  )

  return (
    <DelegationContext.Provider value={state}>
      {children}
    </DelegationContext.Provider>
  )
}

export function useDelegationContext(): DelegationContextState {
  return useContext(DelegationContext)
}
