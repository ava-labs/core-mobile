import React from 'react'
import { Sheet } from 'components/Sheet'
import { Button, Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'

const AlertScreen = (): JSX.Element => {
  const { params } = useRoute<AlertScreenProps['route']>()
  const navigation = useNavigation<AlertScreenProps['navigation']>()
  const {
    theme: { colors }
  } = useTheme()

  const handleReject = (): void => {
    navigation.goBack()

    params.onReject()
  }

  const handleProceed = (): void => {
    navigation.goBack()

    params.onProceed()
  }

  return (
    <Sheet onClose={handleReject}>
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: 16
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
          {params.alert.details.title}
        </Text>
        <Text variant="body2" sx={{ textAlign: 'center' }}>
          {params.alert.details.description}
        </Text>
      </View>
      <View sx={{ gap: 16, padding: 16 }}>
        <Button type="primary" size="xlarge" onPress={handleReject}>
          {params.alert.details.actionTitles?.reject}
        </Button>
        <Button type="tertiary" size="xlarge" onPress={handleProceed}>
          <Text variant="buttonLarge">
            {params.alert.details.actionTitles?.proceed}
          </Text>
        </Button>
      </View>
    </Sheet>
  )
}

type AlertScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.AlertScreen
>

export default AlertScreen
