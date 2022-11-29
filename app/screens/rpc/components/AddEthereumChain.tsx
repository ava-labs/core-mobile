import AvaText from 'components/AvaText'
import React, { FC } from 'react'
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
import { WalletAddEthereumChainRpcRequest } from 'store/rpc/handlers/wallet_addEthereumChain'
import { DappRpcRequests } from 'store/rpc'
import SwitchEthereumChain from './SwitchEthereumChain'

interface Props {
  dappEvent: WalletAddEthereumChainRpcRequest
  onReject: (request: DappRpcRequests) => void
  onApprove: (request: DappRpcRequests) => void
  onClose: () => void
}

const AddEthereumChain: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const theme = useApplicationContext().theme
  const network = dappEvent.network
  const peerMeta = dappEvent.payload.peerMeta

  if (dappEvent.isExisting) {
    return (
      <SwitchEthereumChain
        dappEvent={dappEvent}
        onApprove={onApprove}
        onReject={onReject}
        onClose={onClose}
      />
    )
  }

  return (
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
            <AvaButton.PrimaryMedium onPress={() => onApprove(dappEvent)}>
              Approve
            </AvaButton.PrimaryMedium>
            <Space y={21} />
            <AvaButton.SecondaryMedium
              onPress={() => {
                onReject(dappEvent)
                onClose()
              }}>
              Reject
            </AvaButton.SecondaryMedium>
          </View>
        </SafeAreaView>
      </NativeViewGestureHandler>
    </ScrollView>
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
