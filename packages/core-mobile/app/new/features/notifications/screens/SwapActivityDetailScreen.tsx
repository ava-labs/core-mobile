import React from 'react'
import { Button, Separator, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useSwapActivitiesStore } from '../store'
import { TokenAmountRow } from '../components/TokenAmountRow'
import { NetworkStatusCard } from '../components/NetworkStatusCard'
import { useSwapActivityDisplay } from '../hooks/useSwapActivityDisplay'

export const SwapActivityDetailScreen = (): JSX.Element => {
  const { removeSwapActivity, swapActivities } = useSwapActivitiesStore()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { navigateToSwap } = useNavigateToSwap()

  // id from route params is transfer.id, which is the Record key
  const swap = swapActivities[id]

  // Always call the hook unconditionally; it returns undefined when swap is undefined.
  const display = useSwapActivityDisplay(swap)

  if (!swap || !display) {
    // TODO: show a proper empty state if swap not found (e.g. invalid id or deleted swap)
    return <></>
  }

  const { status } = display
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'
  const title = isCompleted
    ? 'Swap successful!'
    : isFailed
    ? 'Swap failed'
    : 'Swap in progress'

  const handleFooterPress = (): void => {
    if (isCompleted) {
      router.canGoBack() && router.back()
      removeSwapActivity(id)
      return
    }
    if (isFailed) {
      router.dismiss()
      // Pass the swap id so the swap screen can remove this failed activity
      // once the retry either succeeds or fails (not before).
      navigateToSwap({
        fromTokenId: swap.fromTokenId,
        toTokenId: swap.toTokenId,
        retryingSwapActivityId: swap.transfer.id
      })
      return
    }
    router.canGoBack() && router.back()
  }

  const renderFooter = (): React.ReactNode => (
    <Button size="large" type="primary" onPress={handleFooterPress}>
      {isCompleted ? 'Close' : isFailed ? 'Retry' : "Notify me when it's done"}
    </Button>
  )

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
            symbol={display.fromToken}
            logoUri={display.fromTokenLogoUri}
            networkLogoUri={display.fromNetworkLogoUri}
            amount={display.fromAmount}
            amountUsd={display.fromAmountUsd}
            isDebit={true}
          />
          <Separator sx={{ marginVertical: 8 }} />
          <TokenAmountRow
            symbol={display.toToken}
            logoUri={display.toTokenLogoUri}
            networkLogoUri={display.toNetworkLogoUri}
            amount={display.toAmount}
            amountUsd={display.toAmountUsd}
            isDebit={false}
          />
        </View>

        {/* Card 2: From network + source-chain status */}
        <NetworkStatusCard
          directionLabel="From"
          networkName={display.fromNetwork}
          networkLogoUri={display.fromNetworkLogoUri}
          status={display.fromChainStatus}
        />

        {/* Card 3: To network + target-chain status */}
        <NetworkStatusCard
          directionLabel="To"
          networkName={display.toNetwork}
          networkLogoUri={display.toNetworkLogoUri}
          status={display.toChainStatus}
        />
      </View>
    </ScrollScreen>
  )
}
