import { useRouter } from 'expo-router'
import {
  SUPPORTED_PLATFORM_ID,
  SUPPORTED_PLATFORM_ID_TESTNET
} from 'common/consts/swap'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { TOKEN_IDS } from 'consts/tokenIds'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

interface NavigateToSwapParams {
  fromTokenId?: string // internalId
  toTokenId?: string // internalId
  fromCaip2Id?: string
  toCaip2Id?: string
}

export const useNavigateToSwap = (): {
  navigateToSwap: (params?: NavigateToSwapParams) => void
} => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
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
          initialTokenIdFrom: TOKEN_IDS.AVAX,
          initialTokenIdTo: TOKEN_IDS.USDC,
          initialFromCaip2Id:
            cChainNetwork?.caip2Id ??
            (isDeveloperMode
              ? SUPPORTED_PLATFORM_ID_TESTNET
              : SUPPORTED_PLATFORM_ID),
          initialToCaip2Id:
            cChainNetwork?.caip2Id ??
            (isDeveloperMode
              ? SUPPORTED_PLATFORM_ID_TESTNET
              : SUPPORTED_PLATFORM_ID)
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
        initialFromCaip2Id:
          fromCaip2Id ??
          cChainNetwork?.caip2Id ??
          (isDeveloperMode
            ? SUPPORTED_PLATFORM_ID_TESTNET
            : SUPPORTED_PLATFORM_ID),
        initialToCaip2Id:
          toCaip2Id ??
          cChainNetwork?.caip2Id ??
          (isDeveloperMode
            ? SUPPORTED_PLATFORM_ID_TESTNET
            : SUPPORTED_PLATFORM_ID)
      }
    })
  }

  return { navigateToSwap }
}
