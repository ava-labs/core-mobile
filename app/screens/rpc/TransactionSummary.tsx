import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { useWalletStateContext } from '@avalabs/wallet-react-components'
import {
  DisplayValueParserProps,
  parseDisplayValues,
  RpcTxParams
} from 'rpc/parseDisplayValues'
import { Row } from 'components/Row'
import TabViewAva from 'components/TabViewAva'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { useGasPrice } from 'utils/GasPriceHook'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import TokenAddress from 'components/TokenAddress'

const TransactionSummary = props => {
  const { params } = props.payload
  const txParams = params ? (params[0] as RpcTxParams) : undefined
  const theme = useApplicationContext().theme
  const styles = createStyles()
  const { gasPrice } = useGasPrice()
  const walletState = useWalletStateContext()

  const displayValueProps = {
    gasPrice,
    erc20Tokens: walletState?.erc20Tokens,
    avaxPrice: walletState?.avaxPrice,
    avaxToken: walletState?.avaxToken,
    site: {}
  } as DisplayValueParserProps

  const displayValues = txParams
    ? parseDisplayValues(txParams, displayValueProps)
    : undefined

  return (
    <SafeAreaView
      style={{
        paddingTop: 32,
        flex: 1,
        paddingHorizontal: 16
      }}>
      <AvaText.Heading1>Transaction Summary</AvaText.Heading1>
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
            {displayValues?.site?.domain} requests you to approve the following
            transaction
          </AvaText.Body3>
        </View>
      </View>
      <Row
        style={[
          {
            marginTop: 16,
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
        <TokenAddress address={displayValues?.toAddress ?? ''} hideCopy />
      </Row>
      <Space y={30} />
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <TabViewAva.Item title={'Details'}>
          <View
            style={[{ backgroundColor: theme.colorBg2, marginVertical: 16 }]}>
            <Space y={16} />
            <NetworkFeeSelector
              networkFeeAvax={displayValues?.fee ?? '0'}
              networkFeeUsd={displayValues?.feeUSD.toString(10) ?? '0'}
              gasPrice={displayValues?.gasPrice ?? gasPrice}
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
              {txParams?.data}
            </AvaText.Body3>
          </View>
        </TabViewAva.Item>
      </TabViewAva>
      <View style={styles.actionContainer}>
        <AvaButton.PrimaryMedium onPress={() => props.onConfirm()}>
          Approve
        </AvaButton.PrimaryMedium>
        <Space y={21} />
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

export default TransactionSummary
