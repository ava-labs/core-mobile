import React, { useMemo } from 'react'
import { Sheet } from 'components/Sheet'
import { Button, Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'

const MaliciousActivityWarningScreen = (): JSX.Element => {
  const { params } = useRoute<MaliciousActivityWarningScreenProps['route']>()
  const navigation =
    useNavigation<MaliciousActivityWarningScreenProps['navigation']>()
  const { onUserRejected } = useDappConnectionV2()
  const {
    theme: { colors }
  } = useTheme()

  const content = useMemo(() => {
    if (params.activityType === 'Transaction') {
      return {
        title: 'Scam\nTransaction',
        description: 'This transaction is malicious, do not proceed.',
        rejectButtonTitle: 'Reject Transaction'
      }
    }

    return {
      title: 'Scam\nApplication',
      description: 'This application is malicious, do not proceed.',
      rejectButtonTitle: 'Reject Connection'
    }
  }, [params.activityType])

  const handleReject = (): void => {
    navigation.goBack()

    onUserRejected(params.request)
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
          {content.title}
        </Text>
        <Text variant="body2" sx={{ textAlign: 'center' }}>
          {content.description}
        </Text>
      </View>
      <View sx={{ gap: 16, padding: 16 }}>
        <Button type="primary" size="xlarge" onPress={handleReject}>
          {content.rejectButtonTitle}
        </Button>
        <Button type="tertiary" size="xlarge" onPress={handleProceed}>
          <Text variant="buttonLarge">Proceed Anyway</Text>
        </Button>
      </View>
    </Sheet>
  )
}

type MaliciousActivityWarningScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.MaliciousActivityWarning
>

export default MaliciousActivityWarningScreen
