import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { usePostCapture } from 'hooks/usePosthogCapture'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const FeedbackItem = () => {
  const navigation = useNavigation<NavigationProp>()
  const { capture } = usePostCapture()

  return (
    <AvaListItem.Base
      testID="feedback_item__send_feedback_button"
      title={'Send Feedback'}
      showNavigationArrow
      onPress={() => {
        capture('sendFeedbackClicked')
        navigation.navigate(AppNavigation.Wallet.SendFeedback)
      }}
    />
  )
}

export default FeedbackItem
