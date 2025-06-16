import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  useTheme,
  Text,
  Icons,
  Pressable,
  Image,
  alpha
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { ListScreen } from 'common/components/ListScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { format } from 'date-fns'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { TokenType } from '@avalabs/vm-module-types'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { LoadingState } from 'common/components/LoadingState'
import { useOnRampServiceProvider, useOnRampToken } from '../store'
import { useSearchServiceProviders } from '../hooks/useSearchServiceProviders'
import { ServiceProviderCategories } from '../consts'
import { Quote } from '../types'
import { useServiceProviders } from '../hooks/useServiceProviders'

const NEW_QUOTE_TIME = 60
const IMAGE_SIZE = 36

export const SelectServiceProviderScreen = (): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const { formatCurrency } = useFormatCurrency()
  const [onRampToken] = useOnRampToken()
  const [_, setOnRampServiceProvider] = useOnRampServiceProvider()
  const [newQuoteTime, setNewQuoteTime] = useState(NEW_QUOTE_TIME)
  const {
    crytoQuotes,
    isLoadingCryptoQuotes,
    refetch,
    isRefetchingCryptoQuotes
  } = useServiceProviders()

  const { data: serviceProviders } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: false
  })
  const { getNetwork } = useNetworks()

  const token = useMemo(() => {
    return filteredTokenList.find(
      tk =>
        (tk.networkChainId.toString() === onRampToken?.chainId &&
          tk.type === TokenType.NATIVE) ||
        ('chainId' in tk &&
          tk.chainId?.toString() === onRampToken?.chainId &&
          tk.address === onRampToken?.contractAddress)
    )
  }, [filteredTokenList, onRampToken?.chainId, onRampToken?.contractAddress])

  const network = useMemo(() => {
    return token?.networkChainId
      ? getNetwork(token.networkChainId)
      : token && 'chainId' in token
      ? getNetwork(token.chainId)
      : undefined
  }, [getNetwork, token])

  useEffect(() => {
    if (isLoadingCryptoQuotes || isRefetchingCryptoQuotes) return

    const interval = setInterval(() => {
      setNewQuoteTime(prev => prev - 1)
    }, 1000)

    if (newQuoteTime === 0) {
      setNewQuoteTime(NEW_QUOTE_TIME)
      refetch()
    }

    return () => clearInterval(interval)
  }, [isLoadingCryptoQuotes, isRefetchingCryptoQuotes, newQuoteTime, refetch])

  const dismiss = useCallback(() => {
    canGoBack() && back()
  }, [back, canGoBack])

  const renderHeader = useCallback(() => {
    return (
      <View sx={{ gap: 32 }}>
        <Text>
          External providers are used to process fiat-to-crypto purchases. Rates
          vary between providers
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icons.Custom.Pace color={colors.$textPrimary} />
          <Text>New quote in {formatSeconds(newQuoteTime)}</Text>
        </View>
      </View>
    )
  }, [colors.$textPrimary, newQuoteTime])

  const renderItem = useCallback(
    (item: Quote, index: number) => {
      const serviceProvider = serviceProviders?.find(
        sp => sp.serviceProvider === item.serviceProvider
      )
      const tokenAmount =
        item.destinationAmount - item.totalFee / item.exchangeRate
      const tokenUnitToDisplay =
        network?.networkToken.decimals && token?.symbol
          ? new TokenUnit(
              tokenAmount * 10 ** network.networkToken.decimals,
              network.networkToken.decimals,
              token.symbol
            ).toDisplay()
          : tokenAmount

      return (
        <Pressable
          onPress={() => {
            setOnRampServiceProvider(serviceProvider?.serviceProvider)
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
          <View sx={{ gap: 12, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                overflow: 'hidden',
                backgroundColor: alpha(colors.$textPrimary, 0.1),
                borderRadius: IMAGE_SIZE / 2,
                borderColor: alpha(colors.$textPrimary, 0.1)
              }}>
              <Image
                source={{
                  uri: isDark
                    ? serviceProvider?.logos.darkShort
                    : serviceProvider?.logos.lightShort
                }}
                style={{
                  width: IMAGE_SIZE,
                  height: IMAGE_SIZE
                }}
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
                {serviceProvider?.serviceProvider}
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
          <View>
            <Text
              variant="body2"
              sx={{ textAlign: 'right', fontWeight: 400, lineHeight: 16 }}>
              {tokenUnitToDisplay} {token?.symbol}
            </Text>
            <Text
              variant="subtitle2"
              sx={{ textAlign: 'right', fontWeight: 500, fontSize: 12 }}>
              ~{formatCurrency({ amount: item.fiatAmountWithoutFees })}
            </Text>
          </View>
        </Pressable>
      )
    },
    [
      colors.$surfaceSecondary,
      colors.$textPrimary,
      colors.$textSuccess,
      dismiss,
      formatCurrency,
      isDark,
      network?.networkToken.decimals,
      serviceProviders,
      setOnRampServiceProvider,
      token?.symbol
    ]
  )

  const renderEmpty = useCallback(() => {
    if (isLoadingCryptoQuotes || isRefetchingCryptoQuotes) {
      return <LoadingState sx={{ flex: 1 }} />
    }
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
