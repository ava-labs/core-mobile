import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { selectActiveNetwork, selectNetworks, setActive } from 'store/network'
import { ScrollView, View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import FlexSpacer from 'components/FlexSpacer'
import TextFieldBg from 'components/styling/TextFieldBg'
import { Network } from '@avalabs/chains-sdk'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import { NetworkLogo } from './NetworkLogo'

export type NetworkDetailsProps = {
  chainId: Network['chainId']
  goBack: () => void
}

export default function NetworkDetails({
  chainId,
  goBack
}: NetworkDetailsProps) {
  const networks = useSelector(selectNetworks)
  const network = networks[chainId]
  const activeNetwork = useSelector(selectActiveNetwork)
  const dispatch = useDispatch()

  const isConnected = activeNetwork.chainId === chainId

  if (!network) {
    showSnackBarCustom({
      component: (
        <GeneralToast
          message={`Ooops, seems this network is not available. Please try adding it again.`}
        />
      ),
      duration: 'short'
    })
    goBack()
  }

  function connect() {
    dispatch(setActive(chainId))
  }

  return (
    <>
      {network && (
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <NetworkLogo logoUri={network.logoUri} size={80} />
            <Space y={24} />
            <AvaText.Heading2>{network.chainName}</AvaText.Heading2>
          </View>
          <Space y={40} />
          <DetailItem title={'Network RPC URL'} value={network.rpcUrl} />
          <Space y={24} />
          <DetailItem title={'Chain ID'} value={chainId.toString()} />
          <Space y={24} />
          <DetailItem
            title={'Network Token Symbol'}
            value={network.networkToken.symbol}
          />
          <Space y={24} />
          <DetailItem
            title={'Network Token Name'}
            value={network.networkToken.name}
          />
          <Space y={24} />
          <DetailItem
            title={'Explorer URL'}
            value={network.explorerUrl ?? ''}
          />
          <FlexSpacer minHeight={24} />
          <AvaButton.PrimaryLarge disabled={isConnected} onPress={connect}>
            {isConnected ? 'Connected' : 'Connect'}
          </AvaButton.PrimaryLarge>
        </ScrollView>
      )}
    </>
  )
}

function DetailItem({ title, value }: { title: string; value: string }) {
  const { theme } = useApplicationContext()

  return (
    <>
      <AvaText.Body1>{title}</AvaText.Body1>
      <Space y={8} />
      <TextFieldBg>
        <AvaText.ButtonMedium textStyle={{ color: theme.colorText1 }}>
          {value}
        </AvaText.ButtonMedium>
      </TextFieldBg>
    </>
  )
}
