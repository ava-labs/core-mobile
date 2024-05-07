import { TransactionDisplayValues } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'
import { View } from 'react-native'
import { sharedStyles } from './styles'

export function AddLiquidityTransaction({
  toAddress,
  fromAddress,
  description
}: TransactionDisplayValues): JSX.Element {
  const theme = useApplicationContext().theme
  const activeAccount = useSelector(selectAccountByAddress(fromAddress))

  return (
    <>
      <View
        style={[
          sharedStyles.info,
          {
            backgroundColor: theme.colorBg3
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Account</AvaText.Body3>
          <AvaText.Body3>{activeAccount?.name}</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>
            {description?.args?.asset ? 'Contract' : 'To'}
          </AvaText.Body3>
          <TokenAddress address={description?.args?.asset ?? toAddress} />
        </Row>
      </View>
    </>
  )
}
