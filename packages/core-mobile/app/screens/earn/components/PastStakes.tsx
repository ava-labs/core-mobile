import React, { FC } from 'react'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import BigList from 'components/BigList'
import { PChainTransaction, RewardType } from '@avalabs/glacier-sdk'
import { StakeStatus } from 'types/earn'
import { zeroPad } from 'utils/string/zeroPad'
import { usePastStakes } from 'hooks/earn/usePastStakes'
import { StakeCard } from './StakeCard'
import { NoPastStakes } from './ZeroState'
import { StakeListLoader } from './StakeListLoader'

export const PastStakes: FC = () => {
  const { stakes, pullToRefresh, isRefreshing, isLoading } = usePastStakes()

  if (isLoading) {
    return <StakeListLoader />
  }

  const keyExtractor = (item: PChainTransaction): string => item.txHash

  const renderItem = ({
    item,
    index
  }: ListRenderItemInfo<PChainTransaction>): JSX.Element => {
    const title = zeroPad(index + 1, 2)
    const stakeAmount = item.amountStaked?.[0]?.amount
    const endTimestamp = item.endTimestamp
    const rewardUtxo = item.emittedUtxos.find(
      utxo =>
        utxo.rewardType === RewardType.DELEGATOR ||
        utxo.rewardType === RewardType.VALIDATOR
    )
    const rewardAmount = rewardUtxo?.asset.amount
    const txHash = item.txHash

    return (
      <StakeCard
        title={title}
        txHash={txHash}
        status={StakeStatus.Completed}
        stakeAmount={stakeAmount}
        endTimestamp={endTimestamp}
        rewardAmount={rewardAmount}
      />
    )
  }

  return (
    <BigList
      data={stakes}
      renderItem={renderItem}
      ListEmptyComponent={NoPastStakes}
      refreshing={isRefreshing}
      onRefresh={pullToRefresh}
      keyExtractor={keyExtractor}
      estimatedItemSize={233}
      contentContainerStyle={styles.cardContainer}
    />
  )
}

const styles = StyleSheet.create({
  cardContainer: { paddingTop: 8, paddingBottom: '15%', flexGrow: 1 }
})
