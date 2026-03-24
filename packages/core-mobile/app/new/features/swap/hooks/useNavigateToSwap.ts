import { useRouter } from 'expo-router'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'

interface NavigateToSwapParams {
  fromTokenId?: string // internalId or raw contract address
  toTokenId?: string // internalId or raw contract address
  fromCaip2Id?: string
  toCaip2Id?: string
}

export const useNavigateToSwap = (): {
  navigateToSwap: (params?: NavigateToSwapParams) => void
} => {
  const { navigate } = useRouter()
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SWAP_ONBOARDING)
  )
  const navigateToSwap = ({
    fromTokenId,
    toTokenId,
    fromCaip2Id,
    toCaip2Id
  }: NavigateToSwapParams = {}): void => {
    const swapParams: Record<string, string> = {}
    if (fromTokenId !== undefined) swapParams.initialTokenIdFrom = fromTokenId
    if (toTokenId !== undefined) swapParams.initialTokenIdTo = toTokenId
    if (fromCaip2Id !== undefined) swapParams.initialFromCaip2Id = fromCaip2Id
    if (toCaip2Id !== undefined) swapParams.initialToCaip2Id = toCaip2Id
    if (shouldHideOnboarding) {
      navigate({ pathname: '/swap/swap', params: swapParams })
    } else {
      navigate({ pathname: '/swap/onboarding', params: swapParams })
    }
  }

  return { navigateToSwap }
}
