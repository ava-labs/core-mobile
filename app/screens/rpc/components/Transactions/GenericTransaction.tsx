import { TransactionDisplayValues } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import React from 'react'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { View } from 'react-native'
import { Space } from 'components/Space'
import { useActiveAccount } from 'hooks/useActiveAccount'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import { useSelector } from 'react-redux'
import { selectTokenAddress } from 'store/balance'

export function GenericTransaction({
  site,
  description,
  toAddress,
  displayValue,
  name
}: TransactionDisplayValues) {
  const theme = useApplicationContext().theme
  const activeAccount = useActiveAccount()
  const token = useSelector(selectTokenAddress(description?.args?.asset))
  return (
    <>
      <AvaText.Heading1>Transaction Summary</AvaText.Heading1>
      <Space y={16} />
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2 color={theme.colorText1}>
          Approve {site?.name} transaction
        </AvaText.Body2>
        <AvaButton.Base onPress={() => console.log('open data view')}>
          <AvaText.Body1>
            <CarrotSVG color={theme.colorText1} direction={'left'} size={12} />
            <CarrotSVG color={theme.colorText1} size={12} />
          </AvaText.Body1>
        </AvaButton.Base>
      </Row>
      <View
        style={{
          justifyContent: 'space-between',
          marginTop: 8,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16
        }}>
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
        {!!displayValue && (
          <Row
            style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row style={{ alignItems: 'center' }}>
              {token ? (
                <Avatar.Token token={token} />
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
              {/*<AvaText.Body3>$0.32 USD</AvaText.Body3>*/}
            </View>
          </Row>
        )}
      </View>
    </>
  )
}
