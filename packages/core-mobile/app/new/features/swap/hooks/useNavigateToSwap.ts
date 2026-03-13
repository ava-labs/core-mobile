import { useRouter } from 'expo-router'
import {
  SUPPORTED_PLATFORM_ID,
  SUPPORTED_PLATFORM_ID_TESTNET
} from 'common/consts/swap'
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

  const navigateToSwap = ({
    fromTokenId,
    toTokenId,
    fromCaip2Id,
    toCaip2Id
  }: NavigateToSwapParams = {}): void => {
    if (fromTokenId === undefined && toTokenId === undefined) {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/swap',
        params: {
          initialTokenIdFrom: TOKEN_IDS.AVAX,
          initialTokenIdTo: TOKEN_IDS.USDC,
          initialFromCaip2Id: isDeveloperMode
            ? SUPPORTED_PLATFORM_ID_TESTNET
            : SUPPORTED_PLATFORM_ID,
          initialToCaip2Id: isDeveloperMode
            ? SUPPORTED_PLATFORM_ID_TESTNET
            : SUPPORTED_PLATFORM_ID
        }
      })

      return
    }

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/swap',
      params: {
        initialTokenIdFrom: fromTokenId,
        initialTokenIdTo: toTokenId,
        initialFromCaip2Id:
          fromCaip2Id ??
          (isDeveloperMode
            ? SUPPORTED_PLATFORM_ID_TESTNET
            : SUPPORTED_PLATFORM_ID),
        initialToCaip2Id:
          toCaip2Id ??
          (isDeveloperMode
            ? SUPPORTED_PLATFORM_ID_TESTNET
            : SUPPORTED_PLATFORM_ID)
      }
    })
  }

  return { navigateToSwap }
}
