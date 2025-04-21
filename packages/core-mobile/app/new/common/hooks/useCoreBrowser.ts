import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'
import { useDispatch } from 'react-redux'
import { addTab, addHistoryForActiveTab, History } from 'store/browser'

export function useCoreBrowser(): {
  openUrl: (history: Pick<History, 'url' | 'title'>) => void
} {
  const { navigate } = useDebouncedRouter()
  const dispatch = useDispatch()

  const openUrl = (history: Pick<History, 'url' | 'title'>): void => {
    navigate('browser')
    dispatch(addTab())
    dispatch(addHistoryForActiveTab(history))
  }

  return {
    openUrl
  }
}
