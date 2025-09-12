import { router } from 'expo-router'
import { InteractionManager } from 'react-native'

/**
this function is used to navigate to a specific route in the app
when the app is opened from a deeplink
it takes the pathname from the deeplink url and navigates to the portfolio page first
then it navigates to the specific route after a short delay
this is done to ensure that the app is fully loaded before navigating to the specific route
@example navigateFromDeeplinkUrl('/claimStakeReward')
**/
export const navigateFromDeeplinkUrl = (href: string): void => {
  // added InteractionManager and setTimeout of 1000ms here,
  // so that it doesn't navigate too fast before screen re-renders,
  // and the deeplinked screen goes away because of the re-rendering.
  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      // @ts-ignore TODO: make routes typesafe
      router.navigate(href)
    }, 1000)
  })
}
