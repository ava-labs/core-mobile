import React from 'react'

import { StakeCard } from 'screens/earn/components/StakeCard'
import { StakeStatus } from 'types/earn'

export default {
  title: 'Earn/StakeCard'
}

export const Ongoing = () => (
  <StakeCard
    title="01"
    txHash="ofkgLhDXSJUwAvxHhXKWopsBXCTsZTYG9Jkwg1bpKNA3AaK1L"
    status={StakeStatus.Ongoing}
    stakeAmount={'1000000000'}
    estimatedReward={'245000'}
    endTimestamp={1720776065}
  />
)

export const Completed = () => (
  <StakeCard
    title="01"
    txHash="ofkgLhDXSJUwAvxHhXKWopsBXCTsZTYG9Jkwg1bpKNA3AaK1L"
    status={StakeStatus.Completed}
    stakeAmount={'1000000000'}
    endTimestamp={1689153665}
    rewardAmount={'245000'}
  />
)
