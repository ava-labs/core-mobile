import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import TabViewAva from 'components/TabViewAva'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import TokenAddress from 'components/TokenAddress'
// @ts-ignore @javascript
import {
  ApproveTransactionData,
  ContractCall,
  RpcTxParams,
  SwapExactTokensForTokenDisplayValues,
  TransactionDisplayValues
} from 'rpc/models'
import { useExplainTransaction } from 'rpc/useExplainTransaction'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import CustomFees from 'components/CustomFees'
import {useAccountsContext} from '@avalabs/wallet-react-components';

const SignTransaction = props => {
  const { params } = props.payload
  const peerMeta = props.peerMeta
  const txParams: RpcTxParams = params ? (params[0] as RpcTxParams) : undefined
  const styles = createStyles()

  const {
    setCustomFee,
    showCustomSpendLimit,
    setShowCustomSpendLimit,
    setSpendLimit,
    displaySpendLimit,
    customSpendLimit,
    type,
    selectedGasFee,
    ...rest
  } = useExplainTransaction(txParams)

  const contractType = type !== 'CALL' ? type?.toLowerCase() : rest?.abi?.func

  const displayData: TransactionDisplayValues = { ...rest } as any

  const isApprove = contractType && contractType === ContractCall.APPROVE
  const isUnknown = !contractType || contractType === 'UNKNOWN'
  const isTransAction = !isApprove && !isUnknown

  return (
    <SafeAreaView
      style={{
        paddingTop: 32,
        flex: 1,
        paddingHorizontal: 14
      }}>
      <View>
        {!!isUnknown && <View />}
        {!!isApprove && (
          <RpcApproveTransaction
            {...(displayData as ApproveTransactionData)}
            setShowCustomSpendLimit={setShowCustomSpendLimit}
            displayStendLimit={displaySpendLimit}
            onCustomFeeSet={setCustomFee}
            selectedGasFee={selectedGasFee}
          />
        )}
        {!!isTransAction && (
          <>
            <RpcTransaction
              {...(displayData as any)}
              onCustomFeeSet={setCustomFee}
              selectedGasFee={selectedGasFee}
            />
            {displayData.gasPrice.value !== '' &&
              displayData.gasPrice.value !== '0' && (
                <CustomFees
                  gasPrice={displayData.fees.gasPrice}
                  limit={displayData.gasLimit?.toString() ?? '0'}
                  defaultGasPrice={displayData.gasPrice}
                  onChange={modifier => console.log(modifier)}
                  selectedGasFeeModifier={selectedGasFee}
                />
              )}
          </>
        )}
      </View>
      <View style={styles.actionContainer}>
        <AvaButton.PrimaryMedium onPress={() => props.onConfirm(displayData)}>
          Approve
        </AvaButton.PrimaryMedium>
        <Space y={20} />
        <AvaButton.SecondaryMedium onPress={() => props.onCancel()}>
          Reject
        </AvaButton.SecondaryMedium>
      </View>
    </SafeAreaView>
  )
}

const renderCustomLabel = (title: string) => {
  return <AvaText.Heading3>{title}</AvaText.Heading3>
}

function RpcApproveTransaction({
  displayData,
  setShowCustomSpendLimit,
  displaySpendLimit,
  onCustomFeeSet,
  selectedGasFee
}: ApproveTransactionData): JSX.Element {
  const styles = createStyles()
  const theme = useApplicationContext().theme

  return (
    <>
      <AvaText.Heading1>Approve</AvaText.Heading1>
      <Space y={16} />
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <OvalTagBg
          style={{ height: 80, width: 80, backgroundColor: theme.colorBg3 }}>
          <Avatar.Custom name={'AVAX'} symbol={'AVAX'} size={48} />
        </OvalTagBg>
        <View style={styles.domainUrlContainer}>
          {/*<AvaText.Heading2 textStyle={{ textAlign: 'center' }}>*/}
          {/*  {title}*/}
          {/*</AvaText.Heading2>*/}
          <AvaText.Body3>
            {displayData?.site?.domain} requests you to approve the following
            transaction
          </AvaText.Body3>
        </View>
      </View>
      <Row
        style={[
          {
            marginTop: 14,
            justifyContent: 'space-between'
          }
        ]}>
        <AvaText.Body1>Approval amount</AvaText.Body1>
        <AvaText.Body1>Unlimited</AvaText.Body1>
      </Row>
      <Row
        style={[
          {
            marginTop: 16,
            justifyContent: 'space-between'
          }
        ]}>
        <AvaText.Body1>To</AvaText.Body1>
        <TokenAddress address={displayData?.toAddress ?? ''} hideCopy />
      </Row>
      <Space y={30} />
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <TabViewAva.Item title={'Details'}>
          <View
            style={[{ backgroundColor: theme.colorBg2, marginVertical: 16 }]}>
            <Space y={16} />
            <NetworkFeeSelector
              networkFeeAvax={displayData?.fee ?? '0'}
              networkFeeUsd={displayData?.feeUSD?.toString(10) ?? '0'}
              gasPrice={displayData?.gasPrice}
              onWeightedGas={price => {
                console.log(price)
              }}
              weights={{ normal: 1, fast: 1.05, instant: 1.15, custom: 35 }}
              onSettingsPressed={() => {
                // const initGasLimit = displayValues.gasLimit || 0
                // const onCustomGasLimit = (gasLimit: number) =>
                // fees.setGasLimit(gasLimit)
                // navigate(AppNavigation.Modal.EditGasLimit, {
                //   gasLimit: initGasLimit.toString(),
                //   networkFee: netFeeString,
                //   onSave: onCustomGasLimit
                // })
              }}
            />
          </View>
        </TabViewAva.Item>
        <TabViewAva.Item title={'Data'}>
          <View style={{ flex: 1, paddingVertical: 16 }}>
            <AvaText.Body3
              textStyle={{
                padding: 16,
                backgroundColor: theme.colorBg3,
                borderRadius: 15
              }}>
              {displayData?.data}
            </AvaText.Body3>
          </View>
        </TabViewAva.Item>
      </TabViewAva>
    </>
  )
}

function RpcTransaction({
  fromAddress,
  txParams,
  gasPrice,
  gasLimit,
  onCustomFeeSet,
  contract,
  balanceChange,
  abi,
  abiStr,
  selectedGasFee,
  contractType
}: SwapExactTokensForTokenDisplayValues) {
  const styles = createStyles()
  const theme = useApplicationContext().theme

  const sentTokens = balanceChange?.sendTokenList
  const receivedTokens = balanceChange?.receiveTokenList

  const dataString = [abiStr, abi?.params?.join(' '), txParams?.data].join(' ')

  return (
    <>
      <AvaText.Heading1>Transaction Approval</AvaText.Heading1>
      <Space y={16} />
      <View style={[{ backgroundColor: theme.colorBg2, marginVertical: 16 }]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body1>Account</AvaText.Body1>
          <AvaText.Body1>Account Name</AvaText.Body1>
        </Row>
      </View>
      <View style={[{ backgroundColor: theme.colorBg2, marginVertical: 16 }]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body1>Contract</AvaText.Body1>
          <TokenAddress address={contract} />
        </Row>
      </View>
      <AvaText.Body1>Balance Change</AvaText.Body1>
      <View style={[{ backgroundColor: theme.colorBg2, marginVertical: 16 }]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body1>Transaction type</AvaText.Body1>
          <AvaText.Body1>{abi?.func}</AvaText.Body1>
        </Row>
      </View>

      {/*{!!sentTokens.length &&*/}
      {/*  sentTokens.map((token, index) => {*/}
      {/*    const priceBN: BN = new BN(token.price)*/}
      {/*    const amountBN = stringToBN(token.amount, token.decimals)*/}
      {/*    const amountUSD = bnToLocaleString(*/}
      {/*      priceBN.mul(amountBN),*/}
      {/*      token.decimals*/}
      {/*    )*/}
      {/*    return (*/}
      {/*      <View key={token.name}>*/}
      {/*        <Row style={{ justifyContent: 'space-between' }}>*/}
      {/*          <Avatar.Token token={token} />*/}
      {/*          <AvaText.Body1>{token.symbol}</AvaText.Body1>*/}
      {/*          <AvaText.Body1>{token.amount}</AvaText.Body1>*/}
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
      {/*        {isNaN(Number(amountUSD)) ? null : (*/}
      {/*          <AvaText.Body3 currency>{amountUSD}</AvaText.Body3>*/}
      {/*        )}*/}
      {/*      </View>*/}
      {/*    )*/}
      {/*  })}*/}
      {/*/!* arrow *!/*/}
      {/*{!!(sentTokens.length && receivedTokens.length) && (*/}
      {/*  <Row*/}
      {/*    style={{*/}
      {/*      width: '100%',*/}
      {/*      justifyContent: 'center',*/}
      {/*      marginStart: 8*/}
      {/*    }}>*/}
      {/*    <ArrowSVG size={16} color={theme.colorIcon1} rotate={180} />*/}
      {/*  </Row>*/}
      {/*)}*/}
      {/*{!!receivedTokens.length &&*/}
      {/*  receivedTokens.map((token, index) => {*/}
      {/*    const priceBN: BN = new BN(token.price)*/}
      {/*    const amountBN = stringToBN(token.amount, token.decimals)*/}
      {/*    const amountUSD = bnToLocaleString(*/}
      {/*      priceBN.mul(amountBN),*/}
      {/*      token.decimals*/}
      {/*    )*/}
      {/*    return (*/}
      {/*      <View key={token.name}>*/}
      {/*        <Row style={{ justifyContent: 'space-between' }}>*/}
      {/*          <Avatar.Token token={token} />*/}
      {/*          <AvaText.Body1>{token.symbol}</AvaText.Body1>*/}
      {/*          <AvaText.Body1>{token.amount}</AvaText.Body1>*/}
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
      {/*        {isNaN(Number(amountUSD)) ? null : (*/}
      {/*          <AvaText.Body3 currency>{amountUSD}</AvaText.Body3>*/}
      {/*        )}*/}
      {/*      </View>*/}
      {/*    )*/}
      {/*  })}*/}
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <TabViewAva.Item title={'Details'}>
          <View
            style={[{ backgroundColor: theme.colorBg3, marginVertical: 16 }]}>
            <Space y={16} />
            {/*<CustomFees*/}
            {/*  gasPrice={gasPrice}*/}
            {/*  limit={gasLimit?.toString() ?? '0'}*/}
            {/*  onChange={onCustomFeeSet}*/}
            {/*  selectedGasFeeModifier={selectedGasFee}*/}
            {/*/>*/}
          </View>
        </TabViewAva.Item>
        <TabViewAva.Item title={'Data'}>
          {abi && (
            <Row style={{ justifyContent: 'space-between' }}>
              <AvaText.Body1>Function</AvaText.Body1>
              <AvaText.Body1>{abi.func}</AvaText.Body1>
            </Row>
          )}
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body1>Hex Data:</AvaText.Body1>
            <AvaText.Body1>
              {getHexStringToBytes(txParams?.data)} Bytes
            </AvaText.Body1>
          </Row>
          <View style={{ flex: 1, paddingVertical: 14 }}>
            <AvaText.Body3
              textStyle={{
                padding: 16,
                backgroundColor: theme.colorBg3,
                borderRadius: 15
              }}>
              {dataString}
            </AvaText.Body3>
          </View>
        </TabViewAva.Item>
      </TabViewAva>
    </>
  )
}

const createStyles = () =>
  StyleSheet.create({
    root: {
      paddingTop: 24,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      minHeight: 200,
      paddingBottom: 20
    },
    accountCardWrapper: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: '#C4C4C4'
    },
    intro: {
      textAlign: 'center',
      color: 'black',
      fontSize: 16,
      marginBottom: 8,
      marginTop: 16
    },
    warning: {
      color: 'red',
      paddingHorizontal: 24,
      marginVertical: 16,
      fontSize: 14,
      width: '100%',
      textAlign: 'center'
    },
    actionContainer: {
      flex: 0,
      paddingVertical: 16,
      paddingHorizontal: 24
    },
    button: {
      flex: 1
    },
    cancel: {
      marginRight: 8
    },
    confirm: {
      marginLeft: 8
    },
    domainUrlContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10
    },
    domainUrl: {
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 14,
      color: 'black'
    },
    copyAddressContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginHorizontal: 16
    }
  })

export default SignTransaction
