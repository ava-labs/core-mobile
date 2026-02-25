import React, { useCallback } from 'react'
import { Button, Separator, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ErrorState } from 'common/components/ErrorState'
import { useFusionTransfers } from 'features/swapV2/hooks/useZustandStore'
import { useNavigateToSwap } from 'features/swapV2/hooks/useNavigateToSwap'
import { TokenAmountRow } from '../components/TokenAmountRow'
import { SwapStatusCard } from '../components/SwapStatusCard'
import { useSwapActivityDisplay } from '../hooks/useSwapActivityDisplay'

export const SwapActivityDetailScreen = (): JSX.Element => {
  const { navigateToSwap } = useNavigateToSwap()

  const { transfers } = useFusionTransfers()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  // id from route params is transfer.id, which is the Record key
  const transfer = transfers[id]

  // Always call the hook unconditionally; it returns undefined when swap is undefined.
  const display = useSwapActivityDisplay(transfer)

  const handleHide = (): void => {
    router.canGoBack() && router.back()
  }

  const handleRetry = useCallback((): void => {
    router.canGoBack() && router.back()

    if (!transfer) return
    navigateToSwap({
      fromTokenId: transfer.fromToken.internalId,
      toTokenId: transfer.toToken.internalId,
      retryingSwapActivityId: transfer.transfer.id
    })
  }, [navigateToSwap, router, transfer])

  const renderFooter = (): React.ReactNode => {
    if (display?.status === 'failed') {
      return (
        <View sx={{ gap: 8 }}>
          <Button size="large" type="primary" onPress={handleRetry}>
            Retry
          </Button>
          <Button size="large" type="secondary" onPress={handleHide}>
            Hide
          </Button>
        </View>
      )
    }
    return (
      <Button size="large" type="primary" onPress={handleHide}>
        Hide
      </Button>
    )
  }

  const renderEmpty = useCallback(() => {
    return (
      <ErrorState
        sx={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
        title="Transaction failed to load"
        description=""
      />
    )
  }, [])

  const renderContent = useCallback(() => {
    if (!display) return renderEmpty()
    return (
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
            amount={display.fromAmount}
            amountInCurrency={display.fromAmountInCurrency}
            isDebit={true}
          />
          <Separator sx={{ marginVertical: 8 }} />
          <TokenAmountRow
            symbol={display.toToken}
            logoUri={display.toTokenLogoUri}
            amount={display.toAmount}
            amountInCurrency={display.toAmountInCurrency}
            isDebit={false}
          />
        </View>

        {/* Card 2: From network + source-chain status */}
        <SwapStatusCard
          directionLabel="From"
          networkName={display.fromNetwork}
          networkLogoUri={display.fromNetworkLogoUri}
          status={display.fromChainStatus}
        />

        {/* Card 3: To network + target-chain status */}
        <SwapStatusCard
          directionLabel="To"
          networkName={display.toNetwork}
          networkLogoUri={display.toNetworkLogoUri}
          status={display.toChainStatus}
        />
      </View>
    )
  }, [display, renderEmpty])

  const getTitle = useCallback(
    ({ isNavigationTitle = false }: { isNavigationTitle: boolean }) => {
      if (display?.status === 'failed') return `Swap failed`
      if (display?.status === 'completed') return `Swap successful!`
      return isNavigationTitle ? `Swap in progress...` : `Swap\nin progress...`
    },
    [display]
  )

  return (
    <ScrollScreen
      title={getTitle({ isNavigationTitle: false })}
      navigationTitle={getTitle({ isNavigationTitle: true })}
      renderFooter={renderFooter}
      contentContainerStyle={{ flex: 1, padding: 16 }}>
      {renderContent()}
    </ScrollScreen>
  )
}
