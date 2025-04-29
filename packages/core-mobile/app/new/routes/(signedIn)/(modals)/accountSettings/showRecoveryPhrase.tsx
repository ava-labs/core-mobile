import { Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'
import { useLocalSearchParams } from 'expo-router'
import MnemonicScreen from 'features/onboarding/components/MnemonicPhrase'
import React from 'react'

const ShowRecoveryPhraseScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()

  return (
    <ScrollViewScreenTemplate
      title={'Show recovery\nphrase'}
      navigationTitle="Show recovery phrase"
      isModal
      contentContainerStyle={{
        padding: 16
      }}>
      <Text variant="body1">
        This phrase is your access key to your wallet. Carefully write it down
        and store it in a safe location.
      </Text>
      <View sx={{ marginTop: 16, gap: 16 }}>
        <View sx={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icons.Alert.ErrorOutline color={colors.$textDanger} />
          <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
            Losing this phrase will result in lost funds
          </Text>
        </View>
        <MnemonicScreen mnemonic={mnemonic} />
      </View>
    </ScrollViewScreenTemplate>
  )
}

export default ShowRecoveryPhraseScreen
