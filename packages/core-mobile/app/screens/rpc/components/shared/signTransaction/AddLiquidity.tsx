import { AddLiquidityDisplayData } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import AddSVG from 'components/svg/AddSVG'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'
import { View } from 'react-native'
import { sharedStyles } from './styles'

export function AddLiquidityTransaction({
  poolTokens,
  toAddress,
  fromAddress,
  description,
  name
}: AddLiquidityDisplayData): JSX.Element {
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
      <AvaText.Body2>Balance Change</AvaText.Body2>
      <View
        style={[
          {
            backgroundColor: theme.colorBg3
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Transaction type</AvaText.Body3>
          <AvaText.Body3>{name}</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Separator color={theme.colorDisabled} />
        <Space y={12} />

        {!!poolTokens?.length &&
          poolTokens.map((token, index: number) => {
            return (
              <View key={token.name}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row style={{ alignItems: 'center' }}>
                    <Avatar.Custom name={token.name} symbol={token.symbol} />
                    <Space x={16} />
                    <AvaText.Body1>{token.symbol}</AvaText.Body1>
                  </Row>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AvaText.Body1>
                      {token.amountDepositedDisplayValue} {token.symbol}
                    </AvaText.Body1>
                    {isNaN(Number(token.amountCurrencyValue)) ? null : (
                      <AvaText.Body3 color={'white'} currency>
                        {token.amountCurrencyValue}
                      </AvaText.Body3>
                    )}
                  </View>
                  {index < poolTokens?.length - 1 && (
                    <Row
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        marginStart: 8
                      }}>
                      <AddSVG color={theme.colorIcon1} size={16} />
                    </Row>
                  )}
                </Row>
              </View>
            )
          })}
      </View>
    </>
  )
}
