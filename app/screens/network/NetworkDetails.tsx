import React, { useEffect, useState } from 'react'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Network } from 'repository/NetworksRepo'
import { ActivityIndicator, View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import FlexSpacer from 'components/FlexSpacer'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import TextFieldBg from 'components/styling/TextFieldBg'
import { ShowSnackBar } from 'components/Snackbar'
import { useNetworkContext } from '@avalabs/wallet-react-components'
import { getActiveNetwork } from 'screens/network/SupportedNetworkMapper'

type Props = {
  network: Network
}

export default function NetworkDetails({ network }: Props) {
  const networkContext = useNetworkContext()
  const connectedNetwork = networkContext?.network?.name?.trim() ?? ''
  const { theme } = useApplicationContext()

  const [loading, setLoading] = useState(false)

  useEffect(resetLoadingFx, [connectedNetwork, loading, network.name])

  function resetLoadingFx() {
    if (loading && network.name === connectedNetwork) {
      setLoading(false)
    }
  }

  function connect() {
    setLoading(true)
    const activeNetwork = getActiveNetwork(network.name)
    if (activeNetwork) {
      networkContext?.setNetwork(activeNetwork)
    } else {
      ShowSnackBar('Not yet supported')
    }
  }

  return (
    <SafeAreaProvider style={{ flex: 1, padding: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <AvaLogoSVG size={80} />
        <Space y={24} />
        <AvaText.Heading2>{network.name}</AvaText.Heading2>
      </View>
      <Space y={40} />
      <DetailItem title={'Network RPC URL'} value={network.rpcUrl} />
      <Space y={24} />
      <DetailItem title={'Chain ID'} value={network.chainId} />
      <Space y={24} />
      <DetailItem title={'Native Token'} value={network.nativeToken} />
      <Space y={24} />
      <DetailItem title={'Explorer URL'} value={network.explorerUrl ?? ''} />
      <FlexSpacer />
      {loading ? (
        <ActivityIndicator size="large" color={theme.colorPrimary1} />
      ) : (
        <AvaButton.PrimaryLarge
          disabled={network.name === connectedNetwork}
          onPress={connect}>
          {network.name === connectedNetwork ? 'Connected' : 'Connect'}
        </AvaButton.PrimaryLarge>
      )}
    </SafeAreaProvider>
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
