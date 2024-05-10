import React from 'react'
import { Sheet } from 'components/Sheet'
import { Button, Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'

const MaliciousTransactionWarningScreen = (): JSX.Element => {
  const { params } = useRoute<MaliciousTransactionWarningScreenProps['route']>()
  const navigation =
    useNavigation<MaliciousTransactionWarningScreenProps['navigation']>()
  const { onUserRejected } = useDappConnectionV2()
  const {
    theme: { colors }
  } = useTheme()

  const handleReject = (): void => {
    onUserRejected(params.request)

    navigation.goBack()
  }

  const handleProceed = (): void => {
    navigation.goBack()

    navigation.navigate(AppNavigation.Modal.SignTransactionV2, params)
  }

  return (
    <Sheet>
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14
        }}>
        <Icons.Social.RemoveModerator
          color={colors.$avalancheRed}
          width={48}
          height={48}
        />
        <Text
          sx={{
            color: '$avalancheRed',
            fontSize: 27,
            lineHeight: 30,
            fontWeight: '600',
            textAlign: 'center'
          }}>
          Scam{'\n'}Transaction
        </Text>
        <Text variant="body2" sx={{ textAlign: 'center' }}>
          This transaction is malicious{'\n'}do not proceed.
        </Text>
      </View>
      <View sx={{ gap: 16, padding: 16 }}>
        <Button type="primary" size="xlarge" onPress={handleReject}>
          Reject Transaction
        </Button>
        <Button type="tertiary" size="xlarge" onPress={handleProceed}>
          <Text variant="buttonLarge">Proceed Anyway</Text>
        </Button>
      </View>
    </Sheet>
  )
}

type MaliciousTransactionWarningScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.MaliciousTransactionWarning
>

export default MaliciousTransactionWarningScreen
