import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import AnalyticsService from 'services/analytics/AnalyticsService'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const FeedbackItem = (): JSX.Element => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <AvaListItem.Base
      testID="feedback_item__send_feedback_button"
      title={'Send Feedback'}
      showNavigationArrow
      onPress={() => {
        AnalyticsService.capture('sendFeedbackClicked')
        navigation.navigate(AppNavigation.Wallet.SendFeedback)
      }}
    />
  )
}

export default FeedbackItem
