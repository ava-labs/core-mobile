import React, { useState } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { StakeSetupScreenProps } from 'navigation/types'
import { useRoute } from '@react-navigation/native'
import { useSearchNode } from 'hooks/earn/useSearchNode'
import { useNodes } from 'hooks/earn/useNodes'
import { useDelegationContext } from 'contexts/DelegationContext'
import { MatchFound } from './components/MatchFound'
import { Searching } from './components/Searching'
import { NoMatchFound } from './components/NoMatchFound'

type RouteProp = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.NodeSearch
>['route']

export const NodeSearch = (): React.JSX.Element => {
  const { stakeAmount } = useDelegationContext()
  const { stakingEndTime } = useRoute<RouteProp>().params
  const { isFetching, error, data } = useNodes()

  const { validator, error: useSearchNodeError } = useSearchNode({
    stakingAmount: stakeAmount,
    stakingEndTime,
    validators: data?.validators
  })
  const [isShowSearching, setIsShowSearching] = useState(true)
  setTimeout(() => {
    setIsShowSearching(false)
  }, 3000)

  if (isShowSearching || isFetching) return <Searching />
  if (error || useSearchNodeError || !validator) return <NoMatchFound />
  return <MatchFound validator={validator} />
}
