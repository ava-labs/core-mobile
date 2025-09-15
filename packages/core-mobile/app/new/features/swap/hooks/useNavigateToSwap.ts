import { useRouter } from 'expo-router'
import { AVAX_TOKEN_ID, USDC_AVALANCHE_C_TOKEN_ID } from 'common/consts/swap'

export const useNavigateToSwap = (): {
  navigateToSwap: (fromTokenId?: string, toTokenId?: string) => void
} => {
  const { navigate } = useRouter()

  const navigateToSwap = (fromTokenId?: string, toTokenId?: string): void => {
    if (fromTokenId === undefined && toTokenId === undefined) {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/swap',
        params: {
          initialTokenIdFrom: AVAX_TOKEN_ID,
          initialTokenIdTo: USDC_AVALANCHE_C_TOKEN_ID
        }
      })
    }

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/swap',
      params: { initialTokenIdFrom: fromTokenId, initialTokenIdTo: toTokenId }
    })
  }

  return { navigateToSwap }
}
