import React from 'react'
import { SettingRecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LearnMore } from 'seedless/components/LearnMore'

type LearnMoreScreenProps = SettingRecoveryMethodsScreenProps<
  typeof AppNavigation.SettingRecoveryMethods.SettingLearnMore
>

export const SettingLearnMoreScreen = (): JSX.Element => {
  const { totpKey } = useRoute<LearnMoreScreenProps['route']>().params
  const { canGoBack, goBack } =
    useNavigation<LearnMoreScreenProps['navigation']>()

  const handleGoBack = (): void => {
    if (canGoBack()) {
      goBack()
    }
  }

  return <LearnMore totpKey={totpKey} onGoBack={handleGoBack} />
}
