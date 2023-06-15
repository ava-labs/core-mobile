import React, { FC, useEffect } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { BridgeTransaction } from '@avalabs/bridge-sdk'
import { ShowSnackBar } from 'components/Snackbar'
import AvaText from 'components/AvaText'
import AvaListItem from 'components/AvaListItem'
import BridgeSVG from 'components/svg/BridgeSVG'
import { Opacity10 } from 'resources/Constants'
import { StyleSheet, View } from 'react-native'
import Spinner from 'components/animation/Spinner'
import LinkSVG from 'components/svg/LinkSVG'
import { Space } from 'components/Space'
import { useBridgeContext } from 'contexts/BridgeContext'
import { isPendingBridgeTransaction } from 'screens/bridge/utils/bridgeUtils'
import { useBlockchainNames } from 'screens/activity/hooks/useBlockchainNames'
import { Transaction } from 'store/transaction'

interface BridgeTransactionItemProps {
  item: Transaction | BridgeTransaction
  onPress: () => void
}

const BridgeTransactionItem: FC<BridgeTransactionItemProps> = ({
  item,
  onPress
}) => {
  const pending = isPendingBridgeTransaction(item)
  const theme = useApplicationContext().theme
  const { removeBridgeTransaction } = useBridgeContext()
  const { sourceBlockchain, targetBlockchain } = useBlockchainNames(item)

  useEffect(() => {
    if (pending && item.complete) {
      ShowSnackBar(`You have received ${item.amount} ${item.symbol}`)
      removeBridgeTransaction(item.sourceTxHash).then()
    }
  }, [item, pending, removeBridgeTransaction])

  return (
    <AvaListItem.Base
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
      subtitle={`${sourceBlockchain} → ${targetBlockchain}`}
      rightComponent={
        <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
          <AvaText.ActivityTotal ellipsizeMode={'tail'}>
            {pending ? item.amount.toString() : item.amount}{' '}
            {pending ? item.symbol : item.token?.symbol}
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
