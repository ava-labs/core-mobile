import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import AvaButton from 'components/AvaButton'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.DeFiProtocolDetails
>

export const ProtocolDetailsErrorState = () => {
  const { theme } = useApplicationContext()
  const { goBack } = useNavigation<ScreenProps['navigation']>()

  return (
    <View style={{ marginHorizontal: 39 }}>
      <View style={{ alignItems: 'center' }}>
        <Space y={96} />
        <InfoSVG size={56} color={theme.white} />
        <Space y={24} />
        <View style={{ alignItems: 'center' }}>
          <AvaText.Heading5>Data Unavailable!</AvaText.Heading5>
          <Space y={24} />
          <AvaButton.PrimaryLarge onPress={goBack}>Back</AvaButton.PrimaryLarge>
        </View>
      </View>
    </View>
  )
}
