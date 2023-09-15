import React from 'react'
import type { Meta } from '@storybook/react-native'
import { StakeCard } from 'screens/earn/components/StakeCard'
import { StakeStatus } from 'types/earn'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'

export default {
  title: 'Earn/StakeCard'
} as Meta

export const Ongoing = () => (
  <ReactQueryProvider>
    <StakeCard
      title="01"
      txHash="ofkgLhDXSJUwAvxHhXKWopsBXCTsZTYG9Jkwg1bpKNA3AaK1L"
      status={StakeStatus.Ongoing}
      stakeAmount={'1000000000'}
      estimatedReward={'245000'}
      endTimestamp={1720776065}
    />
  </ReactQueryProvider>
)

export const Completed = () => (
  <ReactQueryProvider>
    <StakeCard
      title="01"
      txHash="ofkgLhDXSJUwAvxHhXKWopsBXCTsZTYG9Jkwg1bpKNA3AaK1L"
      status={StakeStatus.Completed}
      stakeAmount={'1000000000'}
      endTimestamp={1689153665}
      rewardAmount={'245000'}
    />
  </ReactQueryProvider>
)
