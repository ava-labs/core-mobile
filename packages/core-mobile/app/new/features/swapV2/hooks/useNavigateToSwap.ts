import { useRouter } from 'expo-router'
import { AVAX_TOKEN_ID, USDC_AVALANCHE_C_TOKEN_ID } from 'common/consts/swap'

interface NavigateToSwapParams {
  fromTokenId?: string
  toTokenId?: string
  retryingSwapActivityId?: string
}

export const useNavigateToSwap = (): {
  navigateToSwap: (params?: NavigateToSwapParams) => void
} => {
  const { navigate } = useRouter()

  const navigateToSwap = ({
    fromTokenId,
    toTokenId,
    retryingSwapActivityId
  }: NavigateToSwapParams = {}): void => {
    if (fromTokenId === undefined && toTokenId === undefined) {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/swapV2',
        params: {
          initialTokenIdFrom: AVAX_TOKEN_ID,
          initialTokenIdTo: USDC_AVALANCHE_C_TOKEN_ID,
          retryingSwapActivityId
        }
      })

      return
    }

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/swapV2',
      params: {
        initialTokenIdFrom: fromTokenId,
        initialTokenIdTo: toTokenId,
        retryingSwapActivityId
      }
    })
  }

  return { navigateToSwap }
}
