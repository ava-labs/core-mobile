import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  useTheme,
  Text,
  Icons,
  Pressable,
  alpha
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { ListScreen } from 'common/components/ListScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { format } from 'date-fns'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useMeldServiceProvider } from '../store'
import { useSearchServiceProviders } from '../hooks/useSearchServiceProviders'
import { ServiceProviderCategories, ServiceProviderNames } from '../consts'
import { Quote } from '../types'
import { useServiceProviders } from '../hooks/useServiceProviders'
import { useMeldTokenWithBalance } from '../hooks/useMeldTokenWithBalance'
import { ServiceProviderIcon } from './ServiceProviderIcon'

const NEW_QUOTE_TIME = 60
const IMAGE_SIZE = 36

export const SelectServiceProvider = ({
  category,
  description
}: {
  category: ServiceProviderCategories
  description: string
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack, dismissAll } = useRouter()
  const { formatCurrency } = useFormatCurrency()
  const [_, setMeldServiceProvider] = useMeldServiceProvider()
  const [newQuoteTime, setNewQuoteTime] = useState(NEW_QUOTE_TIME)
  const {
    crytoQuotes,
    isLoadingCryptoQuotes,
    refetch,
    isRefetchingCryptoQuotes
  } = useServiceProviders({ category })

  const { data: serviceProviders } = useSearchServiceProviders({
    categories: [category]
  })

  const { getNetwork } = useNetworks()

  const hasAvailableServiceProviders = useMemo(() => {
    return crytoQuotes && crytoQuotes?.length > 0
  }, [crytoQuotes])

  const token = useMeldTokenWithBalance({ category })

  const network = useMemo(() => {
    return token?.networkChainId
      ? getNetwork(token.tokenWithBalance.networkChainId)
      : token && 'chainId' in token.tokenWithBalance
      ? getNetwork(token.tokenWithBalance.chainId)
      : undefined
  }, [getNetwork, token])

  useEffect(() => {
    if (
      isLoadingCryptoQuotes ||
      isRefetchingCryptoQuotes ||
      hasAvailableServiceProviders === false
    )
      return

    const interval = setInterval(() => {
      setNewQuoteTime(prev => prev - 1)
    }, 1000)

    if (newQuoteTime === 0) {
      setNewQuoteTime(NEW_QUOTE_TIME)
      refetch()
    }

    return () => clearInterval(interval)
  }, [
    hasAvailableServiceProviders,
    isLoadingCryptoQuotes,
    isRefetchingCryptoQuotes,
    newQuoteTime,
    refetch,
    serviceProviders,
    serviceProviders?.length
  ])

  const dismiss = useCallback(() => {
    dismissAll() // dismiss to the top of selectPaymentMethod stack
    canGoBack() && back() // dismiss the first screen of the selectPaymentMethod stack
  }, [back, canGoBack, dismissAll])

  const renderHeader = useCallback(() => {
    return (
      <View sx={{ gap: 32 }}>
        <Text>{description}</Text>
        {hasAvailableServiceProviders && (
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icons.Custom.Pace color={colors.$textPrimary} />
            <Text>New quote in {formatSeconds(newQuoteTime)}</Text>
          </View>
        )}
      </View>
    )
  }, [
    colors.$textPrimary,
    description,
    hasAvailableServiceProviders,
    newQuoteTime
  ])

  const renderItem = useCallback(
    (item: Quote, index: number) => {
      const serviceProvider = serviceProviders?.find(
        sp => sp.serviceProvider === item.serviceProvider
      )
      const amount =
        category === ServiceProviderCategories.CRYPTO_ONRAMP
          ? item.destinationAmount ?? 0
          : item.sourceAmount ?? 0
      const tokenAmount =
        amount - (item.totalFee ?? 0) / (item.exchangeRate ?? 0)
      const tokenAmountFixed = Math.trunc(tokenAmount * 1_000_000) / 1_000_000 // truncate to 6 decimal places

      const tokenUnitToDisplay =
        network?.networkToken.decimals && token?.tokenWithBalance.symbol
          ? new TokenUnit(
              tokenAmountFixed * 10 ** network.networkToken.decimals,
              network.networkToken.decimals,
              token.tokenWithBalance.symbol
            ).toDisplay({ asNumber: true })
          : tokenAmountFixed

      const fiatAmount = tokenUnitToDisplay * (item.exchangeRate ?? 0)

      return (
        <Pressable
          onPress={() => {
            setMeldServiceProvider(serviceProvider?.serviceProvider)
            dismiss()
          }}
          sx={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 18,
            marginHorizontal: 16,
            marginBottom: 10,
            height: 60,
            backgroundColor: colors.$surfaceSecondary,
            justifyContent: 'space-between'
          }}>
          {serviceProvider?.serviceProvider && (
            <View sx={{ gap: 12, flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  overflow: 'hidden',
                  backgroundColor: alpha(colors.$textPrimary, 0.1),
                  borderRadius: IMAGE_SIZE / 2,
                  borderColor: alpha(colors.$textPrimary, 0.1)
                }}>
                <ServiceProviderIcon
                  serviceProvider={serviceProvider.serviceProvider}
                  size={IMAGE_SIZE}
                />
              </View>
              <View>
                <Text
                  variant="body1"
                  sx={{
                    lineHeight: 16,
                    fontWeight: 600,
                    color: colors.$textPrimary
                  }}>
                  {ServiceProviderNames[serviceProvider.serviceProvider]}
                </Text>
                {index === 0 && (
                  <Text
                    variant="body2"
                    sx={{
                      color: colors.$textSuccess,
                      fontWeight: 400,
                      lineHeight: 16
                    }}>
                    Lowest price
                  </Text>
                )}
              </View>
            </View>
          )}
          <View>
            <Text
              variant="body2"
              sx={{ textAlign: 'right', fontWeight: 400, lineHeight: 16 }}>
              {tokenUnitToDisplay} {token?.tokenWithBalance.symbol}
            </Text>
            <Text
              variant="subtitle2"
              sx={{ textAlign: 'right', fontWeight: 500, fontSize: 12 }}>
              ~{formatCurrency({ amount: fiatAmount })}
            </Text>
          </View>
        </Pressable>
      )
    },
    [
      category,
      colors.$surfaceSecondary,
      colors.$textPrimary,
      colors.$textSuccess,
      dismiss,
      formatCurrency,
      network?.networkToken.decimals,
      serviceProviders,
      setMeldServiceProvider,
      token?.tokenWithBalance.symbol
    ]
  )

  const renderEmpty = useCallback(() => {
    if (isLoadingCryptoQuotes || isRefetchingCryptoQuotes) {
      return <LoadingState sx={{ flex: 1 }} />
    }
    return (
      <ErrorState
        sx={{ flex: 1 }}
        title="No service providers available"
        description="Try a different token or amount"
      />
    )
  }, [isLoadingCryptoQuotes, isRefetchingCryptoQuotes])

  return (
    <ListScreen
      isModal
      title="Change provider"
      renderHeader={renderHeader}
      data={crytoQuotes}
      renderItem={item => renderItem(item.item, item.index)}
      renderEmpty={renderEmpty}
    />
  )
}

function formatSeconds(seconds: number): string {
  const date = new Date(0)
  date.setSeconds(seconds)
  return format(date, 'm:ss')
}
