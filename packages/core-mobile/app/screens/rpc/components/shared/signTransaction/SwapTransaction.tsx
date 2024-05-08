import { TransactionDisplayValues } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'
import { sharedStyles } from './styles'

export function SwapTransaction({
  fromAddress,
  toAddress
}: TransactionDisplayValues): JSX.Element {
  const theme = useApplicationContext().theme
  const account = useSelector(selectAccountByAddress(fromAddress))

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
          <AvaText.Body3 color={theme.colorText1}>Account</AvaText.Body3>
          <AvaText.Body3 color={theme.colorText1}>
            {account?.name}
          </AvaText.Body3>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3 color={theme.colorText1}>Contract</AvaText.Body3>
          <TokenAddress
            textColor={theme.colorText1}
            address={toAddress ?? ''}
          />
        </Row>
      </View>
    </>
  )
}
