import { useRouter } from 'expo-router'

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

  const navigateToSwap = ({
    fromTokenId,
    toTokenId,
    fromCaip2Id,
    toCaip2Id
  }: NavigateToSwapParams = {}): void => {
    const swapParams = {
      initialTokenIdFrom: fromTokenId,
      initialTokenIdTo: toTokenId,
      initialFromCaip2Id: fromCaip2Id,
      initialToCaip2Id: toCaip2Id
    }
    // @ts-ignore navigate to modal root so _layout.tsx decides between onboarding/swap
    navigate({ pathname: '/swap', params: swapParams })
  }

  return { navigateToSwap }
}
