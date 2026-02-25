import { useRouter } from 'expo-router'
import { AVAX_TOKEN_ID, USDC_AVALANCHE_C_TOKEN_ID } from 'common/consts/swap'

interface NavigateToSwapParams {
  fromTokenId?: string
  toTokenId?: string
}

export const useNavigateToSwap = (): {
  navigateToSwap: (params?: NavigateToSwapParams) => void
} => {
  const { navigate } = useRouter()

  const navigateToSwap = ({
    fromTokenId,
    toTokenId
  }: NavigateToSwapParams = {}): void => {
    if (fromTokenId === undefined && toTokenId === undefined) {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/swap',
        params: {
          initialTokenIdFrom: AVAX_TOKEN_ID,
          initialTokenIdTo: USDC_AVALANCHE_C_TOKEN_ID
        }
      })

      return
    }

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/swap',
      params: {
        initialTokenIdFrom: fromTokenId,
        initialTokenIdTo: toTokenId
      }
    })
  }

  return { navigateToSwap }
}
