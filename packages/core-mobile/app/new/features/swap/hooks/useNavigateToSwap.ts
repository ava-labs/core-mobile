import { useRouter } from 'expo-router'
import { caip2ChainIds } from 'consts/caip2ChainIds'
import { tokenIds } from 'consts/tokenIds'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

interface NavigateToSwapParams {
  fromTokenId?: string // internalId or raw contract address
  toTokenId?: string // internalId or raw contract address
  fromCaip2Id?: string
  toCaip2Id?: string
}

export const useNavigateToSwap = (): {
  navigateToSwap: (params?: NavigateToSwapParams) => void
} => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const shouldHideOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SWAP_ONBOARDING)
  )
  const { navigate } = useRouter()

  const navigateToSwap = ({
    fromTokenId,
    toTokenId,
    fromCaip2Id,
    toCaip2Id
  }: NavigateToSwapParams = {}): void => {
    const isDefaultSwapPair =
      fromTokenId === undefined && toTokenId === undefined

    const params = isDefaultSwapPair
      ? {
          initialTokenIdFrom: tokenIds.AVAX,
          initialTokenIdTo: tokenIds.USDC,
          initialFromCaip2Id: isDeveloperMode
            ? caip2ChainIds.FUJI
            : caip2ChainIds.C_CHAIN,
          initialToCaip2Id: isDeveloperMode
            ? caip2ChainIds.FUJI
            : caip2ChainIds.C_CHAIN
        }
      : {
          initialTokenIdFrom: fromTokenId,
          initialTokenIdTo: toTokenId,
          initialFromCaip2Id:
            fromCaip2Id ??
            (isDeveloperMode ? caip2ChainIds.FUJI : caip2ChainIds.C_CHAIN),
          initialToCaip2Id:
            toCaip2Id ??
            (isDeveloperMode ? caip2ChainIds.FUJI : caip2ChainIds.C_CHAIN)
        }

    if (!shouldHideOnboarding) {
      navigate({
        pathname: '/swap/onboarding',
        params
      })
      return
    }

    navigate({
      pathname: '/swap/swap',
      params
    })
  }

  return { navigateToSwap }
}
