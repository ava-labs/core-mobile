import { SwapExactTokensForTokenDisplayValues } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import React, { Dispatch } from 'react'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import ArrowSVG from 'components/svg/ArrowSVG'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'

export function SwapTransaction({
  path,
  fromAddress,
  toAddress,
  site,
  setShowTxData
}: SwapExactTokensForTokenDisplayValues & {
  setShowTxData?: Dispatch<boolean>
}) {
  const theme = useApplicationContext().theme
  const account = useSelector(selectAccountByAddress(fromAddress))
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sentToken = path[0]!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const receivingToken = path[path.length - 1]!

  return (
    <>
      <AvaText.Heading1>Approve Swap</AvaText.Heading1>
      <Space y={16} />
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2 color={theme.colorText1}>
          Approve {site?.name} transaction
        </AvaText.Body2>
        <AvaButton.Base onPress={() => setShowTxData?.(true)}>
          <Row>
            <CarrotSVG color={theme.colorText1} direction={'left'} size={12} />
            <CarrotSVG color={theme.colorText1} size={12} />
          </Row>
        </AvaButton.Base>
      </Row>
      <View
        style={[
          {
            marginTop: 8,
            backgroundColor: theme.colorBg3,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Account</AvaText.Body3>
          <AvaText.Body3>{account?.title}</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Contract</AvaText.Body3>
          <TokenAddress address={toAddress} />
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
          <AvaText.Body3>Swap</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Separator color={theme.colorDisabled} />
        <Space y={12} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ alignItems: 'center' }}>
            <Avatar.Token token={sentToken} />
            <Space x={8} />
            <AvaText.Body1>{sentToken?.symbol}</AvaText.Body1>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body2 color={theme.colorText1}>
              {sentToken.amountIn?.value} {sentToken?.symbol}
            </AvaText.Body2>
            <AvaText.Body3 currency>
              {sentToken?.amountCurrencyValue}
            </AvaText.Body3>
          </View>
        </Row>
        <Row
          style={{
            width: '100%',
            marginStart: 8,
            paddingVertical: 10
          }}>
          <ArrowSVG size={16} color={theme.colorIcon1} rotate={0} />
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ alignItems: 'center' }}>
            <Avatar.Token token={receivingToken} />
            <Space x={8} />
            <AvaText.Body1>{receivingToken?.symbol}</AvaText.Body1>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body2 color={theme.colorText1}>
              {receivingToken.amountOut?.value} {sentToken?.symbol}
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
