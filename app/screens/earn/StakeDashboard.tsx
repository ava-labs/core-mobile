import React, { useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import AvaText from 'components/AvaText'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'
import { useAllActiveStakes } from 'hooks/earn/useAllActiveStakes'
import { scheduleStakingCompleteNotifications } from 'store/notifications'
import { useFocusEffect } from '@react-navigation/native'
import { Balance } from './components/Balance'
import { StakeTabs } from './StakeTabs'
import { WrongNetwork } from './WrongNetwork'

export const StakeDashboard = () => {
  const network = useSelector(selectActiveNetwork)
  const dispatch = useDispatch()
  const [firstStakesQuery, secondStakesQuery] = useAllActiveStakes()

  const isAvalancheNetork = [
    ChainId.AVALANCHE_TESTNET_ID,
    ChainId.AVALANCHE_MAINNET_ID
  ].includes(network.chainId)

  useFocusEffect(
    useCallback(() => {
      if (!firstStakesQuery.isLoading && !secondStakesQuery.isLoading) {
        const merged = [
          ...(firstStakesQuery.data ?? []),
          ...(secondStakesQuery.data ?? [])
        ].map(transaction => {
          return {
            txHash: transaction.txHash,
            endTimestamp: transaction.endTimestamp,
            accountIndex: transaction.index as number,
            isDeveloperMode: transaction.isDeveloperMode
          }
        })
        dispatch(scheduleStakingCompleteNotifications(merged))
      }
    }, [
      dispatch,
      firstStakesQuery.data,
      firstStakesQuery.isLoading,
      secondStakesQuery.data,
      secondStakesQuery.isLoading
    ])
  )

  if (!isAvalancheNetork) {
    return <WrongNetwork />
  }

  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold>Stake</AvaText.LargeTitleBold>
      <Balance />
      <StakeTabs />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16
  }
})
