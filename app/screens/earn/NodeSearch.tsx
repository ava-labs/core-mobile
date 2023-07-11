import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useRoute } from '@react-navigation/native'
import { useSearchNode } from 'hooks/earn/useSearchNode'
import { useNodes } from 'hooks/earn/useNodes'
import { MatchFound } from './components/MatchFound'
import { Searching } from './components/Searching'
import { NoMatchFound } from './components/NoMatchFound'

type NavigationProp = EarnScreenProps<
  typeof AppNavigation.Earn.NodeSearch
>['route']

export const NodeSearch = () => {
  const { stakingEndTime, stakingAmount } = useRoute<NavigationProp>().params
  const { isFetching, error, data } = useNodes()
  const { validator, error: useSearchNodeError } = useSearchNode({
    stakingAmount,
    stakingEndTime,
    validators: data?.validators
  })

  if (isFetching) return <Searching />
  if (error) return <NoMatchFound />
  if (useSearchNodeError || !validator) return <NoMatchFound />
  return <MatchFound validator={validator} />
}
