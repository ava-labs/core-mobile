import { useRouter } from 'expo-router'
import {
  AVAX_TOKEN_ID,
  SUPPORTED_PLATFORM_ID,
  USDC_AVALANCHE_C_TOKEN_ID
} from 'common/consts/swap'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'

interface NavigateToSwapParams {
  fromTokenId?: string // internalId or localId
  toTokenId?: string // internalId or localId
  fromCaip2Id?: string
  toCaip2Id?: string
}

export const useNavigateToSwap = (): {
  navigateToSwap: (params?: NavigateToSwapParams) => void
} => {
  const { navigate } = useRouter()
  const cChainNetwork = useCChainNetwork()

  const navigateToSwap = ({
    fromTokenId,
    toTokenId,
    fromCaip2Id,
    toCaip2Id
  }: NavigateToSwapParams = {}): void => {
    if (fromTokenId === undefined && toTokenId === undefined) {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/swapV2',
        params: {
          initialTokenIdFrom: AVAX_TOKEN_ID,
          initialTokenIdTo: USDC_AVALANCHE_C_TOKEN_ID,
          initialFromCaip2Id: cChainNetwork?.caip2Id ?? SUPPORTED_PLATFORM_ID,
          initialToCaip2Id: cChainNetwork?.caip2Id ?? SUPPORTED_PLATFORM_ID
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
        initialFromCaip2Id: fromCaip2Id,
        initialToCaip2Id: toCaip2Id
      }
    })
  }

  return { navigateToSwap }
}
