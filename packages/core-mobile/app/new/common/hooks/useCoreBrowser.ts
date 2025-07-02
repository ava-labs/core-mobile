import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { addTab, addHistoryForActiveTab, History } from 'store/browser'

export function useCoreBrowser(): {
  openUrl: (history: Pick<History, 'url' | 'title'>) => void
  openUrlInSimpleBrowser: (history: Pick<History, 'url' | 'title'>) => void
} {
  const { navigate } = useRouter()
  const dispatch = useDispatch()

  const createNewActiveTab = useCallback(
    (history: Pick<History, 'url' | 'title'>): void => {
      dispatch(addTab())
      dispatch(addHistoryForActiveTab(history))
    },
    [dispatch]
  )

  const openUrl = useCallback(
    (history: Pick<History, 'url' | 'title'>): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate('/browser')
      createNewActiveTab(history)
    },
    [createNewActiveTab, navigate]
  )

  // open url in a new screen with no input controls
  const openUrlInSimpleBrowser = useCallback(
    (history: Pick<History, 'url' | 'title'>): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate('/browserScreen')
      createNewActiveTab(history)
    },
    [createNewActiveTab, navigate]
  )

  return {
    openUrl,
    openUrlInSimpleBrowser
  }
}
