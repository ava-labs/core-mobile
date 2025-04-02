import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'

export type BalanceItemProps = {
  balanceType: string
  iconColor: string
  balance: string
  poppableItem?: React.ReactNode
  testID?: string
}

export const BalanceItem = ({
  balanceType,
  iconColor,
  balance,
  poppableItem,
  testID = 'balance_item'
}: BalanceItemProps): React.JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <Row key={balanceType} style={{ alignItems: 'center' }}>
      <View style={[styles.dot, { backgroundColor: iconColor }]} />
      <AvaText.Subtitle2
        textStyle={{
          color: theme.neutral50,
          lineHeight: 24.5,
          marginHorizontal: 8
        }}
        testID={testID}>
        {`${balance} AVAX`}
      </AvaText.Subtitle2>
      <AvaText.Caption
        textStyle={{
          alignSelf: 'flex-end',
          color: theme.neutral400,
          lineHeight: 19.92
        }}>
        {balanceType}
      </AvaText.Caption>
      {!!poppableItem && poppableItem}
    </Row>
  )
}

const styles = StyleSheet.create({
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8
  }
})
