import React, { useCallback, useMemo } from 'react'
import { Button, Separator, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ErrorState } from 'common/components/ErrorState'
import { useFusionTransfers } from 'features/swap/hooks/useZustandStore'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { NotificationSwapStatus } from '../types'
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

  const handleDismiss = (): void => {
    router.canGoBack() && router.back()
  }

  const handleRetry = useCallback((): void => {
    router.canGoBack() && router.back()

    if (!transfer) return
    navigateToSwap({
      fromTokenId: transfer.fromToken.internalId,
      toTokenId: transfer.toToken.internalId,
      fromCaip2Id: transfer.transfer.sourceChain.chainId,
      toCaip2Id: transfer.transfer.targetChain.chainId
    })
  }, [navigateToSwap, router, transfer])

  const renderFooter = (): React.ReactNode => {
    if (display?.status === NotificationSwapStatus.Failed) {
      return (
        <View sx={{ gap: 8 }}>
          <Button size="large" type="primary" onPress={handleRetry}>
            Retry
          </Button>
          <Button size="large" type="tertiary" onPress={handleDismiss}>
            Dismiss
          </Button>
        </View>
      )
    }
    return (
      <Button size="large" type="primary" onPress={handleDismiss}>
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
            networkLogoUri={display.fromNetworkLogoUri}
            networkChainId={display.fromNetworkChainId}
            amount={display.fromAmount}
            amountInCurrency={display.fromAmountInCurrency}
            isDebit={true}
          />
          <Separator sx={{ marginVertical: 8 }} />
          <TokenAmountRow
            symbol={display.toToken}
            logoUri={display.toTokenLogoUri}
            networkLogoUri={display.toNetworkLogoUri}
            networkChainId={display.toNetworkChainId}
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
          networkChainId={display.fromNetworkChainId}
          status={display.fromChainStatus}
          confirmations={display.fromConfirmations}
        />

        {/* Card 3: To network + target-chain status */}
        <SwapStatusCard
          directionLabel="To"
          networkName={display.toNetwork}
          networkLogoUri={display.toNetworkLogoUri}
          networkChainId={display.toNetworkChainId}
          status={display.toChainStatus}
          note={display.refundNote}
          confirmations={display.toConfirmations}
        />

        {display.errorReason !== undefined && (
          <Text
            variant="body2"
            sx={{
              color: '$textDanger',
              textAlign: 'center',
              marginHorizontal: '5%'
            }}>
            {display.errorReason}
          </Text>
        )}
      </View>
    )
  }, [display, renderEmpty])

  const title = useMemo(() => {
    if (display?.status === NotificationSwapStatus.Failed) return `Swap failed`
    if (display?.status === NotificationSwapStatus.Completed)
      return `Swap\nsuccessful`
    if (display?.status === NotificationSwapStatus.Refunded)
      return `Swap\npartial failure`
    return `Swap\nin progress...`
  }, [display])

  const navigationTitle = useMemo(() => {
    return title.replace('\n', ' ')
  }, [title])

  return (
    <ScrollScreen
      title={title}
      navigationTitle={navigationTitle}
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      {renderContent()}
    </ScrollScreen>
  )
}
