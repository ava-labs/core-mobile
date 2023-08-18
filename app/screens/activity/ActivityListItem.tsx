import React, { FC, useEffect } from 'react'
import { View, Dimensions } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import { DdRum } from '@datadog/mobile-react-native'
import MovementIndicator from 'components/MovementIndicator'
import { truncateAddress } from 'utils/Utils'
import { Transaction } from 'store/transaction'
import LinkSVG from 'components/svg/LinkSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'

const windowWidth = Dimensions.get('window').width

type Props = {
  tx: Transaction
  onPress?: () => void
}

const ActivityListItem: FC<Props> = ({ tx, onPress }) => {
  useEffect(() => {
    DdRum.startView('ActivityListItem', 'ActivityListItem', {}, Date.now())

    return () => {
      DdRum.stopView('ActivityListItem', {}, Date.now())
    }
  }, [])

  const { theme } = useApplicationContext()
  const title = tx.isContractCall ? 'Contract Call' : tx.token?.name ?? ''

  const subtitle = (
    tx.isSender
      ? `To: ${truncateAddress(tx.to ?? '')}`
      : `From: ${truncateAddress(tx.from ?? '')}`
  ).toLowerCase()

  const leftComponent = <MovementIndicator metric={tx.isSender ? -1 : 0} />

  const rightComponent = tx.isContractCall ? (
    <View>
      <Space y={4} />
      <LinkSVG color={theme.white} />
    </View>
  ) : (
    <AvaText.ActivityTotal
      ellipsizeMode={'tail'}
      numberOfLines={2}
      textStyle={{
        marginTop: 2,
        marginLeft: windowWidth * 0.1,
        maxWidth: windowWidth * 0.3,
        textAlign: 'right'
      }}>
      {tx.isSender ? '-' : '+'}
      {tx.amount} {tx.token?.symbol}
    </AvaText.ActivityTotal>
  )

  return (
    <AvaListItem.Base
      title={title}
      subtitle={subtitle}
      leftComponent={leftComponent}
      rightComponent={rightComponent}
      onPress={onPress}
      embedInCard
    />
  )
}

export default ActivityListItem
