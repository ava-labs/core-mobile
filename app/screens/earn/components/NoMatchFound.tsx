import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import AvaText from 'components/AvaText'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import AvaButton from 'components/AvaButton'

type NavigationProp = EarnScreenProps<
  typeof AppNavigation.Earn.NodeSearch
>['navigation']

export const NoMatchFound = () => {
  const { theme } = useApplicationContext()
  const { navigate, popToTop, goBack } = useNavigation<NavigationProp>()

  const handleStartOver = () => navigate(AppNavigation.Earn.StakingAmount)

  const handleCanel = () => {
    popToTop()
    goBack()
  }

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <InfoSVG size={80} color={theme.warningMain} />
        <Space y={24} />
        <AvaText.Heading5>We Couldn’t Find a Match</AvaText.Heading5>
        <Space y={8} />
        <AvaText.Body2
          textStyle={{
            textAlign: 'center',
            color: theme.colorText1,
            lineHeight: 20
          }}>
          Core was unable to find a node that matches your requirements. Please
          start over or try again later.
        </AvaText.Body2>
      </View>
      <View style={{ width: '100%' }}>
        <AvaButton.PrimaryLarge onPress={handleStartOver}>
          Start Over
        </AvaButton.PrimaryLarge>
        <Space y={16} />
        <AvaButton.SecondaryLarge onPress={handleCanel}>
          Cancel
        </AvaButton.SecondaryLarge>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '5%',
    justifyContent: 'space-between',
    marginTop: '40%'
  }
})
