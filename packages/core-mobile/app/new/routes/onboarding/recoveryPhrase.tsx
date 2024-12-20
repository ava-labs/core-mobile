import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import {
  Button,
  Icons,
  SafeAreaView,
  ScrollView,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { InteractionManager } from 'react-native'
import WalletSDK from 'utils/WalletSDK'
import MnemonicScreen from 'new/components/MnemonicPhrase'

export default function RecoveryPhrase(): JSX.Element {
  const router = useRouter()
  const { theme } = useTheme()
  const [localMnemonic, setLocalMnemonic] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  function handleNext(): void {
    showAlert({
      title: 'Security Warning',
      description:
        'For your security, you should not screenshot your recovery phrase. It is best to write it down and store it in a secure location.',
      buttons: [
        {
          text: 'Dismiss',
          style: 'cancel',
          onPress: () => {
            router.navigate('./createPin')
          }
        }
      ]
    })
  }

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      ;(async () => {
        const newPhrase = await WalletSDK.generateMnemonic()
        setLocalMnemonic(newPhrase)
        setIsLoading(false)
      })()
    })
  }, [])

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView sx={{ flex: 1 }}>
        <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
          <Text
            sx={{ marginRight: 10, marginTop: 8, marginBottom: 10 }}
            variant="heading2">
            Here is your wallet's recovery phrase
          </Text>
          <View sx={{ marginTop: 8, gap: 16 }}>
            <Text variant="subtitle1">
              This phrase is your access key to your wallet. Carefully write it
              down and store it in a safe location
            </Text>
            <View sx={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Icons.Alert.IconErrorOutline color={theme.colors.$textDanger} />
              <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
                Losing this phrase will result in lost funds
              </Text>
            </View>
            <MnemonicScreen isLoading={isLoading} mnemonic={localMnemonic} />
          </View>
        </ScrollView>
        <View
          sx={{
            padding: 16,
            backgroundColor: '$surfacePrimary'
          }}>
          <Button
            size="large"
            type="primary"
            onPress={handleNext}
            disabled={isLoading}>
            Next
          </Button>
        </View>
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}
