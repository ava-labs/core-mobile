import { AddLiquidityDisplayData } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useActiveAccount } from 'hooks/useActiveAccount'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import Separator from 'components/Separator'
import Avatar from 'components/Avatar'
import AddSVG from 'components/svg/AddSVG'
import TabViewAva from 'components/TabViewAva'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import React from 'react'

export function AddLiquidityTx({
  poolTokens,
  toAddress,
  fromAddress,
  txParams,
  gasPrice,
  gasLimit,
  onCustomFeeSet,
  transactionState,
  hash,
  error,
  selectedGasFee
}: AddLiquidityDisplayData) {
  const theme = useApplicationContext().theme
  const activeNetwork = useActiveNetwork()
  const activeAccount = useActiveAccount()
  // const sentTokens = balanceChange?.sendTokenList
  // const receivedTokens = balanceChange?.receiveTokenList
  // const dataString = [abiStr, abi?.params?.join(' '), txParams?.data].join(' ')

  return (
    <>
      <AvaText.Heading1>Add Liquidity to pool</AvaText.Heading1>
      <Space y={8} />
      {/*<AvaText.Body2>Approve Swimmer Network Transaction</AvaText.Body2>*/}
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
          <AvaText.Body3>Account</AvaText.Body3>
          <AvaText.Body3>{activeAccount?.title}</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Contract</AvaText.Body3>
          <TokenAddress address={toAddress} />
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Website</AvaText.Body3>
          <AvaText.Body2>https://app.avaae.com</AvaText.Body2>
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
        {/*<Row style={{ justifyContent: 'space-between' }}>*/}
        {/*  <AvaText.Body3>Transaction type</AvaText.Body3>*/}
        {/*  <AvaText.Body3>{abi?.func}</AvaText.Body3>*/}
        {/*</Row>*/}
        <Space y={8} />
        <Separator color={theme.colorDisabled} />
        <Space y={12} />
        {/*{!!abi?.fun?.includes('approve') && (*/}
        {/*  <Row style={{ justifyContent: 'space-between' }}>*/}
        {/*    <Row style={{ alignItems: 'center' }}>*/}
        {/*      <Avatar.Custom name={'avax'} symbol={'AVAX'} />*/}
        {/*      <Space x={8} />*/}
        {/*      <AvaText.Body3>AVAX</AvaText.Body3>*/}
        {/*    </Row>*/}
        {/*    <View style={{ alignItems: 'flex-end' }}>*/}
        {/*      <AvaText.Body1>4,000.2334 AVAX</AvaText.Body1>*/}
        {/*      <AvaText.Body3>$0.32 USD</AvaText.Body3>*/}
        {/*    </View>*/}
        {/*  </Row>*/}
        {/*)}*/}

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
                    {isNaN(Number(token.amountUSDValue)) ? null : (
                      <AvaText.Body3 color={'white'} currency>
                        {token.amountUSDValue}
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
        {/* arrow */}
        {/*{!!(sentTokens.length && receivedTokens.length) && (*/}
        {/*  <Row*/}
        {/*    style={{*/}
        {/*      width: '100%',*/}
        {/*      marginStart: 8,*/}
        {/*      paddingVertical: 10*/}
        {/*    }}>*/}
        {/*    <ArrowSVG size={16} color={theme.colorIcon1} rotate={0} />*/}
        {/*  </Row>*/}
        {/*)}*/}
        {/*{!!receivedTokens?.length &&*/}
        {/*  receivedTokens.map((token: RpcTokenReceive, index: number) => {*/}
        {/*    const priceBN: BN = new BN(token.price)*/}
        {/*    const amountBN = stringToBN(token.amount, token.decimals)*/}
        {/*    const amountUSD = bnToLocaleString(*/}
        {/*      priceBN.mul(amountBN),*/}
        {/*      token.decimals*/}
        {/*    )*/}
        {/*    return (*/}
        {/*      <View key={token.name}>*/}
        {/*        <Row style={{ justifyContent: 'space-between' }}>*/}
        {/*          <Row style={{ alignItems: 'center' }}>*/}
        {/*            <Avatar.Custom name={token.name} logoUri={token.logoURI} />*/}
        {/*            <Space x={16} />*/}
        {/*            <AvaText.Body1>{token.symbol}</AvaText.Body1>*/}
        {/*          </Row>*/}
        {/*          <View style={{ alignItems: 'flex-end' }}>*/}
        {/*            <AvaText.Body1>*/}
        {/*              {token.amount} {token.symbol}*/}
        {/*            </AvaText.Body1>*/}
        {/*            {isNaN(Number(amountUSD)) ? null : (*/}
        {/*              <AvaText.Body3 color={'white'} currency>*/}
        {/*                {amountUSD}*/}
        {/*              </AvaText.Body3>*/}
        {/*            )}*/}
        {/*          </View>*/}
        {/*          {index < sentTokens.length - 1 && (*/}
        {/*            <Row*/}
        {/*              style={{*/}
        {/*                width: '100%',*/}
        {/*                justifyContent: 'center',*/}
        {/*                marginStart: 8*/}
        {/*              }}>*/}
        {/*              <AddSVG color={theme.colorIcon1} size={16} />*/}
        {/*            </Row>*/}
        {/*          )}*/}
        {/*        </Row>*/}
        {/*      </View>*/}
        {/*    )*/}
        {/*  })}*/}
      </View>
      <Space y={16} />
      <TabViewAva>
        <TabViewAva.Item title={'Fees'}>
          <NetworkFeeSelector
            gasPrice={gasPrice}
            limit={gasLimit ?? 0}
            onChange={onCustomFeeSet}
            currentModifier={selectedGasFee}
            network={activeNetwork}
          />
        </TabViewAva.Item>
        <TabViewAva.Item title={'Data'}>
          <>
            <Row style={{ justifyContent: 'space-between' }}>
              <AvaText.Body1>Hex Data:</AvaText.Body1>
              <AvaText.Body1>
                {getHexStringToBytes(txParams?.data)} Bytes
              </AvaText.Body1>
            </Row>
            {/*<View style={{ flex: 1, paddingVertical: 14 }}>*/}
            {/*  <AvaText.Body3*/}
            {/*    textStyle={{*/}
            {/*      padding: 16,*/}
            {/*      backgroundColor: theme.colorBg3,*/}
            {/*      borderRadius: 15*/}
            {/*    }}>*/}
            {/*    {dataString}*/}
            {/*  </AvaText.Body3>*/}
            {/*</View>*/}
          </>
        </TabViewAva.Item>
      </TabViewAva>
    </>
  )
}
