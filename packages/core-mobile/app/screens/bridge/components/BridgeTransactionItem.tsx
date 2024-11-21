import React, { FC, useMemo } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import AvaListItem from 'components/AvaListItem'
import BridgeSVG from 'components/svg/BridgeSVG'
import { Opacity10 } from 'resources/Constants'
import { StyleSheet, View } from 'react-native'
import Spinner from 'components/animation/Spinner'
import LinkSVG from 'components/svg/LinkSVG'
import { Space } from 'components/Space'
import {
  isPendingBridgeTransaction,
  isUnifiedBridgeTransfer
} from 'screens/bridge/utils/bridgeUtils'
import { useBlockchainNames } from 'screens/activity/hooks/useBlockchainNames'
import { Transaction } from 'store/transaction'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'

interface BridgeTransactionItemProps {
  item: Transaction | BridgeTransaction | BridgeTransfer
  onPress: () => void
}

const BridgeTransactionItem: FC<BridgeTransactionItemProps> = ({
  item,
  onPress
}) => {
  const pending = isPendingBridgeTransaction(item)
  const theme = useApplicationContext().theme
  const { sourceBlockchain, targetBlockchain } = useBlockchainNames(item)

  const amount = useMemo(() => {
    if (!pending) return item.tokens[0]?.amount

    if (isUnifiedBridgeTransfer(item)) {
      return bigintToBig(item.amount, item.asset.decimals).toString()
    }

    return undefined
  }, [item, pending])

  return (
    <AvaListItem.Base
      testID="bridgeActivityListItem"
      title={pending ? 'Bridging...' : 'Bridge'}
      leftComponent={
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.colorStroke2 + Opacity10
            }
          ]}>
          <BridgeSVG size={20} color={theme.colorPrimary1} />
          {pending && item && (
            <View style={{ position: 'absolute' }}>
              <Spinner size={50} />
            </View>
          )}
        </View>
      }
      subtitle={`${sourceBlockchain ?? 'Unknown'} → ${
        targetBlockchain ?? 'Unknown'
      }`}
      rightComponent={
        <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
          <AvaText.ActivityTotal ellipsizeMode={'tail'}>
            {amount}{' '}
            {pending
              ? isUnifiedBridgeTransfer(item)
                ? item.asset.symbol
                : item.symbol
              : item.tokens[0]?.symbol}
          </AvaText.ActivityTotal>
          {'explorerLink' in item && item?.explorerLink && (
            <>
              <Space y={8} />
              <LinkSVG color={theme.white} />
            </>
          )}
        </View>
      }
      embedInCard
      onPress={onPress}
    />
  )
}

const styles = StyleSheet.create({
  indicator: {
    paddingHorizontal: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default BridgeTransactionItem
