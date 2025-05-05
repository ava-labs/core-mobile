import { router } from 'expo-router'

/**
this function is used to navigate to a specific route in the app
when the app is opened from a deeplink
it takes the pathname from the deeplink url and navigates to the portfolio page first
then it navigates to the specific route after a short delay
this is done to ensure that the app is fully loaded before navigating to the specific route
@example navigateFromDeeplinkUrl('/claimStakeReward')
**/
export const navigateFromDeeplinkUrl = (href: string): void => {
  // @ts-ignore TODO: make routes typesafe
  router.navigate('/portfolio')
  setTimeout(() => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate(href)
  }, 100)
}
