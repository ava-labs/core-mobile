import AvaText from 'components/AvaText'
import React, { useCallback } from 'react'
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
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import RpcRequestBottomSheet from './RpcRequestBottomSheet'
import { SwitchEthereumChainView } from './SwitchEthereumChain'

type AddEthereumChainScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.AddEthereumChain
>

const AddEthereumChain = () => {
  const { goBack } = useNavigation<AddEthereumChainScreenProps['navigation']>()
  const { request, network, isExisting } =
    useRoute<AddEthereumChainScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionContext()
  const theme = useApplicationContext().theme
  const peerMeta = request.payload.peerMeta

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { network, isExisting })
    goBack()
  }, [goBack, isExisting, network, onApprove, request])

  if (isExisting) {
    return (
      <SwitchEthereumChainView
        request={request}
        network={network}
        onApprove={approveAndClose}
        onReject={rejectAndClose}
      />
    )
  }

  return (
    <RpcRequestBottomSheet onClose={rejectAndClose}>
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
                <Avatar.Custom
                  name={peerMeta?.name ?? ''}
                  size={48}
                  logoUri={peerMeta?.icons[0]}
                />
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
            <FlexSpacer minHeight={30} />
            <View style={styles.actionContainer}>
              <AvaButton.PrimaryMedium onPress={approveAndClose}>
                Approve
              </AvaButton.PrimaryMedium>
              <Space y={21} />
              <AvaButton.SecondaryMedium onPress={rejectAndClose}>
                Reject
              </AvaButton.SecondaryMedium>
            </View>
          </SafeAreaView>
        </NativeViewGestureHandler>
      </ScrollView>
    </RpcRequestBottomSheet>
  )
}

function DetailItem({ title, value }: { title: string; value: string }) {
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

export default AddEthereumChain
