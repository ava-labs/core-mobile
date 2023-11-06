import { useFocusEffect, useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import { useCallback } from 'react'
import { BackHandler } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { goBackward, selectCanGoBack } from 'store/browser/slices/tabs'

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export const useHardwareBackHandler = (): void => {
  // we want to allow users with Android physical back button to go back in browser history,
  // if the user is already in the first page of the active tab in the browser, then we want to
  // take the user back to previous navigation scren if there is any
  const dispatch = useDispatch()
  const canBrowserGoBack = useSelector(selectCanGoBack)
  const { goBack, canGoBack } = useNavigation<TabViewNavigationProp>()

  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean | null | undefined => {
        if (canBrowserGoBack) {
          dispatch(goBackward())
          return true
        }
        if (canGoBack()) {
          goBack()
          return true
        }
        return false
      }
      BackHandler.addEventListener('hardwareBackPress', onBackPress)

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress)
    }, [canBrowserGoBack, canGoBack, dispatch, goBack])
  )
}
