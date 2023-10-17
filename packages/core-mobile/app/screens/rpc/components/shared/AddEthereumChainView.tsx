import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import {
  NativeViewGestureHandler,
  ScrollView
} from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import Avatar from 'components/Avatar'
import { Network } from '@avalabs/chains-sdk'
import RpcRequestBottomSheet from './RpcRequestBottomSheet'

type Props = {
  dappName: string
  dappLogo: string | undefined
  network: Network
  onReject: () => void
  onApprove: () => void
}

const AddEthereumChainView = ({
  network,
  dappName,
  dappLogo,
  onReject,
  onApprove
}: Props): JSX.Element => {
  const theme = useApplicationContext().theme

  return (
    <RpcRequestBottomSheet onClose={onReject}>
      <ScrollView>
        <NativeViewGestureHandler>
          <SafeAreaView style={styles.safeView}>
            <AvaText.LargeTitleBold>Add New Network?</AvaText.LargeTitleBold>
            <Space y={30} />
            <View style={styles.logoView}>
              <OvalTagBg
                style={{
                  height: 80,
                  width: 80,
                  backgroundColor: theme.colorBg3
                }}>
                <Avatar.Custom name={dappName} size={48} logoUri={dappLogo} />
              </OvalTagBg>
            </View>
            <Space y={16} />
            <DetailItem title={'Network RPC URL'} value={network.rpcUrl} />
            <Space y={16} />
            <DetailItem title={'Chain ID'} value={network.chainId.toString()} />
            <Space y={16} />
            <DetailItem
              title={'Network Token Symbol'}
              value={network.networkToken.symbol}
            />
            <Space y={16} />
            <DetailItem
              title={'Network Token Name'}
              value={network.networkToken.name}
            />
            <Space y={16} />
            <DetailItem
              title={'Explorer URL'}
              value={network.explorerUrl ?? ''}
            />
            <Space y={16} />
            <DetailItem title={'Testnet'} value={String(network.isTestnet)} />
            <FlexSpacer minHeight={30} />
            <View style={styles.actionContainer}>
              <AvaButton.PrimaryMedium onPress={onApprove}>
                Approve
              </AvaButton.PrimaryMedium>
              <Space y={21} />
              <AvaButton.SecondaryMedium onPress={onReject}>
                Reject
              </AvaButton.SecondaryMedium>
            </View>
          </SafeAreaView>
        </NativeViewGestureHandler>
      </ScrollView>
    </RpcRequestBottomSheet>
  )
}

const DetailItem = ({
  title,
  value
}: {
  title: string
  value: string
}): JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <>
      <AvaText.Body2>{title}</AvaText.Body2>
      <Space y={8} />
      <View style={[styles.container, { backgroundColor: theme.colorBg3 }]}>
        <AvaText.ButtonMedium textStyle={{ color: theme.colorText1 }}>
          {value}
        </AvaText.ButtonMedium>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  safeView: {
    paddingTop: 32,
    flex: 1,
    paddingHorizontal: 16
  },
  logoView: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8
  }
})

export default AddEthereumChainView
