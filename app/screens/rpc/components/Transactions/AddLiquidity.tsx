import { AddLiquidityDisplayData } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import AddSVG from 'components/svg/AddSVG'
import React from 'react'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'

export function AddLiquidityTransaction({
  poolTokens,
  toAddress,
  fromAddress,
  description,
  name,
  site
}: AddLiquidityDisplayData) {
  const theme = useApplicationContext().theme
  const activeAccount = useSelector(selectAccountByAddress(fromAddress))

  return (
    <>
      <AvaText.Heading1>Add Liquidity to pool</AvaText.Heading1>
      <Space y={16} />
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2 color={theme.colorText1}>
          Approve {site?.name} transaction
        </AvaText.Body2>
        <AvaButton.Base onPress={() => console.log('open data view')}>
          <Row>
            <CarrotSVG color={theme.colorText1} direction={'left'} size={12} />
            <CarrotSVG color={theme.colorText1} size={12} />
          </Row>
        </AvaButton.Base>
      </Row>
      <View
        style={[
          {
            justifyContent: 'space-between',
            marginTop: 8,
            backgroundColor: theme.colorBg3,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Account</AvaText.Body3>
          <AvaText.Body3>{activeAccount?.title}</AvaText.Body3>
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
            backgroundColor: theme.colorBg3,
            marginTop: 8,
            marginBottom: 16,
            borderRadius: 10,
            padding: 16
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
