import { useDispatch } from 'react-redux'
import { addHistoryForActiveTab, AddHistoryPayload } from 'store/browser'

export function useGoogleSearch(): {
  navigateToGoogleSearchResult: (input: string) => void
} {
  const dispatch = useDispatch()
  

  return { navigateToGoogleSearchResult }
}
