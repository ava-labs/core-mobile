import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
  Dispatch
} from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { type Step } from 'services/earn/computeDelegationSteps/types'
import { useDelegation } from 'hooks/earn/useDelegation'
import { zeroAvaxPChain } from 'utils/units/zeroValues'

export type Compute = (stakeAmount: bigint) => Promise<Step[]>

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
  stakeAmount: TokenUnit
  steps: Step[]
  networkFees: bigint
  compute: Compute
  delegate: Delegate
  setStakeAmount: Dispatch<TokenUnit>
}

const ZERO_AVAX = zeroAvaxPChain()

export const DelegationContext = createContext<DelegationContextState>(
  {} as DelegationContextState
)

export const DelegationContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const [stakeAmount, setStakeAmount] = useState<TokenUnit>(ZERO_AVAX)
  const { steps, networkFees, compute, delegate } = useDelegation()

  const state: DelegationContextState = useMemo(
    () => ({
      steps,
      compute,
      delegate,
      setStakeAmount,
      stakeAmount,
      networkFees
    }),
    [compute, delegate, setStakeAmount, steps, stakeAmount, networkFees]
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
