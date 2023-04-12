import { TransactionDisplayValues } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import React from 'react'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { View } from 'react-native'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import { useSelector } from 'react-redux'
import { selectTokenByAddress } from 'store/balance'
import isEmpty from 'lodash.isempty'
import { selectActiveAccount } from 'store/account'
import { sharedStyles } from './styles'

export function GenericTransaction({
  description,
  toAddress,
  displayValue,
  name
}: TransactionDisplayValues) {
  const theme = useApplicationContext().theme
  const activeAccount = useSelector(selectActiveAccount)
  const token = useSelector(selectTokenByAddress(description?.args?.asset))
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
            {activeAccount?.title}
          </AvaText.Body3>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>
            {description?.args?.asset ? 'Contract' : 'To'}
          </AvaText.Body3>
          <TokenAddress address={description?.args?.asset ?? toAddress} />
        </Row>
      </View>
      {!isEmpty(displayValue) && (
        <>
          <AvaText.Body2>Balance Change</AvaText.Body2>
          <View
            style={[
              {
                backgroundColor: theme.colorBg3,
                marginTop: 8,
                marginBottom: 16,
                borderRadius: 10,
                padding: 16
              }
            ]}>
            <Row style={{ justifyContent: 'space-between' }}>
              <AvaText.Body3 color={theme.colorText1}>
                Transaction type
              </AvaText.Body3>
              <AvaText.Body3 color={theme.colorText1}>{name}</AvaText.Body3>
            </Row>
            <Space y={8} />
            <Separator color={theme.colorDisabled} />
            <Space y={12} />
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ alignItems: 'center' }}>
                {token ? (
                  <Avatar.Token
                    name={token.name}
                    symbol={token.symbol}
                    logoUri={token.logoUri}
                  />
                ) : (
                  <Avatar.Custom name={'avax'} symbol={'AVAX'} />
                )}
                <Space x={8} />
                <AvaText.Body1>{token ? token?.symbol : 'AVAX'}</AvaText.Body1>
              </Row>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Body2 color={theme.colorText1}>
                  {displayValue} {token?.symbol}
                </AvaText.Body2>
                {/*<AvaText.Body3 currency>{token?.priceInCurrency}</AvaText.Body3>*/}
              </View>
            </Row>
          </View>
        </>
      )}
    </>
  )
}
