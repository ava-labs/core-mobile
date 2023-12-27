import { addHistoryForActiveTab, AddHistoryPayload } from 'store/browser'
import AppNavigation from 'navigation/AppNavigation'
import { useDispatch } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { BrowserScreenProps } from 'navigation/types'

type NavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export function useGoogleSearch(): { searchGoogle: (input: string) => void } {
  const dispatch = useDispatch()
  const { navigate } = useNavigation<NavigationProp>()
  const searchGoogle = (input: string): void => {
    const url = 'https://www.google.com/search?q=' + encodeURIComponent(input)
    const history: AddHistoryPayload = {
      title: input,
      url
    }
    dispatch(addHistoryForActiveTab(history))
    navigate(AppNavigation.Browser.TabView)
  }

  return { searchGoogle }
}
