import React, { createContext, ReactNode, useContext, useMemo } from 'react'
import {
  type Step,
  Operation
} from 'services/earn/computeDelegationSteps/types'
import { useDelegation } from 'hooks/earn/useDelegation'
import { AdditionalDelegatorOutput } from 'services/wallet/types'

export type ComputeSteps = (stakeAmount: bigint) => Promise<Step[]>

type TransactionHash = string

export type OnDelegationProgress = (
  step: number,
  operation: Operation | null
) => void

export type Delegate = ({
  steps,
  startDate,
  endDate,
  nodeId,
  onProgress,
  additionalOutputs
}: {
  steps: Step[]
  startDate: Date
  endDate: Date
  nodeId: string
  onProgress?: OnDelegationProgress
  /**
   * Extra outputs bundled atomically with the delegation tx. Used by the
   * Fast Stake fee flow; when omitted, the delegation has no extra outputs.
   */
  additionalOutputs?: readonly AdditionalDelegatorOutput[]
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
