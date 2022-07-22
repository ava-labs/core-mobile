import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { useWalletStateContext } from '@avalabs/wallet-react-components'
import {DisplayValueParserProps, parseDisplayValues, RpcTxParams} from 'rpc/parseDisplayValues';
import TokenAddress from 'components/TokenAddress';
import {Row} from 'components/Row';
import TabViewAva from 'components/TabViewAva';
import NetworkFeeSelector from 'components/NetworkFeeSelector';
import {useGasPrice} from 'utils/GasPriceHook';

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

const TransactionSummary = props => {
  const { id, method, params } = props.payload
  const txParams = params[0] as RpcTxParams
  const theme = useApplicationContext().theme
  const styles = createStyles()
  const { addresses } = useWalletStateContext()!
  const { gasPrice,  } = useGasPrice()
  // const walletState = useWalletStateContext()

  // const displayValueProps = {
  //   gasPrice,
  //   erc20Tokens: walletState?.erc20Tokens,
  //   avaxPrice: walletState?.avaxPrice,
  //   avaxToken: walletState?.avaxToken,
  //   site: {
  //     domain: 'app.paraswap.com',
  //     name: 'paraswap',
  //     icon: ''
  //   },
  // } as DisplayValueParserProps;

  // const displayValues = parseDisplayValues(txParams, displayValueProps)

  return (
    <SafeAreaView
      style={{ backgroundColor: theme.background, paddingTop: 42, flex: 1 }}>
      <AvaText.LargeTitleBold>Transaction Summary</AvaText.LargeTitleBold>
      <Space y={16} />
      <View
        style={[
          styles.copyAddressContainer,
          { backgroundColor: theme.colorBg2, alignItems: 'center' }
        ]}>
        <AvaText.Body1>Account 1 > <TokenAddress address={addresses.addrC} /></AvaText.Body1>
      </View>
      <Space y={16} />
      <View
        style={[
          styles.copyAddressContainer,
          { backgroundColor: theme.colorBg2 }
        ]}>
        <Row style={{justifyContent: 'space-between'}}>
          <AvaText.Body1>Transaction</AvaText.Body1>
          <AvaText.Body1>SimpleSwap</AvaText.Body1>
        </Row>
      </View>
      <Space y={30} />
      <TabViewAva>
        <TabViewAva.Item title={'Details'}>
          <View
            style={[
              styles.copyAddressContainer,
              { backgroundColor: theme.colorBg2, marginVertical: 16 }
            ]}>

            <Space y={16} />
          <NetworkFeeSelector onSettingsPressed={() => {}} networkFeeAvax={'0.02'}
                              networkFeeUsd={'1.03'} gasPrice={gasPrice}
                              onWeightedGas={price => {console.log(price)}}
                              weights={{ normal: 1, fast: 1.05, instant: 1.15, custom: 35 }} />

          </View>
        </TabViewAva.Item>
        <TabViewAva.Item title={'Data'} >
          <View style={{flex: 1}}>
            <AvaText.Body3>{txParams.data}</AvaText.Body3>
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

export default TransactionSummary
