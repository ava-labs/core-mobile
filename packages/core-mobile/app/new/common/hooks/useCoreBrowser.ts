import { useRouter } from 'expo-router'
import { useDispatch } from 'react-redux'
import { addTab, addHistoryForActiveTab, History } from 'store/browser'

export function useCoreBrowser(): {
  openUrl: (history: Pick<History, 'url' | 'title'>) => void
} {
  const { navigate } = useRouter()
  const dispatch = useDispatch()

  const openUrl = (history: Pick<History, 'url' | 'title'>): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('browser')
    dispatch(addTab())
    dispatch(addHistoryForActiveTab(history))
  }

  return {
    openUrl
  }
}
