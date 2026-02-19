import React, { useCallback } from 'react'
import { Button, Separator, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { swapActivitiesStore } from '../store'
import { removeSwapActivity } from '../hooks/useSwapActivities'
import { TokenAmountRow } from '../components/TokenAmountRow'
import { NetworkStatusCard } from '../components/NetworkStatusCard'

export const SwapActivityDetailScreen = (): JSX.Element => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { navigateToSwap } = useNavigateToSwap()

  const swap = swapActivitiesStore(
    useCallback(state => state.swapActivities.find(s => s.id === id), [id])
  )

  const isCompleted = swap?.status === 'completed'
  const isFailed = swap?.status === 'failed'
  const title = isCompleted
    ? 'Swap successful!'
    : isFailed
    ? 'Swap failed'
    : 'Swap in progress'

  const handleFooterPress = useCallback(() => {
    if (isCompleted) {
      removeSwapActivity(id)
      router.canGoBack() && router.back()
      return
    }
    if (isFailed) {
      removeSwapActivity(id)
      router.dismiss()
      // TODO: navigate to swap details screen
      // with the failed swap pre-filled for retrying
      // the swap with from and to token ID
      // and amount if possible. For now just navigate to swap screen.
      navigateToSwap()
      return
    }
    router.canGoBack() && router.back()
  }, [router, isCompleted, isFailed, id, navigateToSwap])

  const renderFooter = (): React.ReactNode => (
    <Button size="large" type="primary" onPress={handleFooterPress}>
      {isCompleted ? 'Close' : isFailed ? 'Retry' : "Notify me when it's done"}
    </Button>
  )

  if (!swap) {
    // TODO: show a proper empty state if swap not found (e.g. invalid id or deleted swap)
    return <></>
  }

  return (
    <ScrollScreen
      title={title}
      navigationTitle={title}
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 16, marginTop: 16 }}>
        {/* Card 1: token amounts */}
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 8
          }}>
          <TokenAmountRow
            symbol={swap.fromToken}
            logoUri={swap.fromTokenLogoUri}
            networkLogoUri={swap.fromNetworkLogoUri}
            amount={swap.fromAmount}
            amountUsd={swap.fromAmountUsd}
            isDebit={true}
          />
          <Separator sx={{ marginVertical: 8 }} />
          <TokenAmountRow
            symbol={swap.toToken}
            logoUri={swap.toTokenLogoUri}
            networkLogoUri={swap.toNetworkLogoUri}
            amount={swap.toAmount}
            amountUsd={swap.toAmountUsd}
            isDebit={false}
          />
        </View>

        {/* Card 2: From network + status */}
        <NetworkStatusCard
          directionLabel="From"
          networkName={swap.fromNetwork}
          networkLogoUri={swap.fromNetworkLogoUri}
          status={swap.status}
        />

        {/* Card 3: To network + status */}
        <NetworkStatusCard
          directionLabel="To"
          networkName={swap.toNetwork}
          networkLogoUri={swap.toNetworkLogoUri}
          status={swap.status}
        />
      </View>
    </ScrollScreen>
  )
}
