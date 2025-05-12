import {
  Button,
  Icons,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import MnemonicScreen from 'features/onboarding/components/MnemonicPhrase'
import React, { useCallback } from 'react'

export const RecoveryPhrase = ({
  onNext,
  mnemonic,
  isLoading
}: {
  onNext: () => void
  mnemonic: string
  isLoading: boolean
}): React.JSX.Element => {
  const { theme } = useTheme()

  const handleNext = useCallback(() => {
    showAlert({
      title: 'Security warning',
      description:
        'For your security, you should not screenshot your recovery phrase. It is best to write it down and store it in a secure location.',
      buttons: [
        {
          text: 'Dismiss',
          style: 'cancel',
          onPress: onNext
        }
      ]
    })
  }, [onNext])

  const renderFooter = useCallback(() => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={handleNext}
        disabled={isLoading}>
        Next
      </Button>
    )
  }, [handleNext, isLoading])

  return (
    <ScrollScreen
      title="Here is your wallet's recovery phrase"
      subtitle="This phrase is your access key to your wallet. Carefully write it down and store it in a safe location"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ marginTop: 16, gap: 16 }}>
        <View sx={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icons.Alert.ErrorOutline color={theme.colors.$textDanger} />
          <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
            Losing this phrase will result in lost funds
          </Text>
        </View>
        <MnemonicScreen isLoading={isLoading} mnemonic={mnemonic} />
      </View>
    </ScrollScreen>
  )
}
