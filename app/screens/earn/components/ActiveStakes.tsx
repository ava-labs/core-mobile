import React from 'react'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import BigList from 'components/BigList'
import { useActiveStakes } from 'hooks/earn/useActiveStakes'
import { PChainTransaction } from '@avalabs/glacier-sdk'
import { StakeStatus } from 'types/earn'
import { zeroPad } from 'utils/string/zeroPad'
import { StakeCard } from './StakeCard'
import { NoActiveStakes } from './ZeroState'
import { StakeListLoader } from './StakeListLoader'

export const ActiveStakes = () => {
  const { stakes, refetch, isRefetching, isLoading } = useActiveStakes()

  if (isLoading) {
    return <StakeListLoader />
  }

  const keyExtractor = (item: PChainTransaction) => item.txHash

  const renderItem = ({
    item,
    index
  }: ListRenderItemInfo<PChainTransaction>) => {
    const title = zeroPad(index + 1, 2)
    const stakeAmount = item.amountStaked?.[0]?.amount
    const estimatedReward = item.estimatedReward
    const endTimestamp = item.endTimestamp
    const txHash = item.txHash

    return (
      <StakeCard
        title={title}
        txHash={txHash}
        status={StakeStatus.Ongoing}
        stakeAmount={stakeAmount}
        estimatedReward={estimatedReward}
        endTimestamp={endTimestamp}
      />
    )
  }

  return (
    <BigList
      data={stakes}
      renderItem={renderItem}
      ListEmptyComponent={NoActiveStakes}
      refreshing={isRefetching}
      onRefresh={refetch}
      keyExtractor={keyExtractor}
      estimatedItemSize={201}
      contentContainerStyle={styles.cardContainer}
    />
  )
}

const styles = StyleSheet.create({
  cardContainer: { paddingTop: 8, paddingBottom: '15%', flexGrow: 1 }
})
