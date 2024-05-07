import { SwapExactTokensForTokenDisplayValues } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import React from 'react'
import ArrowSVG from 'components/svg/ArrowSVG'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'
import { sharedStyles } from './styles'

export function SwapTransaction({
  path,
  fromAddress,
  toAddress
}: SwapExactTokensForTokenDisplayValues): JSX.Element {
  const theme = useApplicationContext().theme
  const account = useSelector(selectAccountByAddress(fromAddress))
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sentToken = path[0]!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const receivingToken = path[path.length - 1]!

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
      <AvaText.Body2>Balance Change</AvaText.Body2>
      <View
        style={[
          sharedStyles.info,
          {
            backgroundColor: theme.colorBg3
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3 color={theme.colorText1}>
            Transaction type
          </AvaText.Body3>
          <AvaText.Body3 color={theme.colorText1}>Swap</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Separator color={theme.colorDisabled} />
        <Space y={12} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ alignItems: 'center' }}>
            <Avatar.Token
              name={sentToken.name}
              symbol={sentToken.symbol}
              logoUri={sentToken.logoUri}
            />
            <Space x={8} />
            <AvaText.Body1>{sentToken?.symbol}</AvaText.Body1>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body2 color={theme.colorText1}>
              {sentToken.amountIn?.value} {sentToken?.symbol}
            </AvaText.Body2>
            <AvaText.Body3 color={theme.colorText2} currency>
              {sentToken?.amountCurrencyValue}
            </AvaText.Body3>
          </View>
        </Row>
        <Row style={sharedStyles.arrow}>
          <ArrowSVG size={11} color={theme.colorIcon1} rotate={-45} />
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ alignItems: 'center' }}>
            <Avatar.Token
              name={receivingToken.name}
              symbol={receivingToken.symbol}
              logoUri={receivingToken.logoUri}
            />
            <Space x={8} />
            <AvaText.Body1>{receivingToken?.symbol}</AvaText.Body1>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body2 color={theme.colorText1}>
              {receivingToken.amountOut?.value} {receivingToken?.symbol}
            </AvaText.Body2>
            <AvaText.Body3 currency>
              {receivingToken?.amountCurrencyValue}
            </AvaText.Body3>
          </View>
        </Row>
      </View>
    </>
  )
}
