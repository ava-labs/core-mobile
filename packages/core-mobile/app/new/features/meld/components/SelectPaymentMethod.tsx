import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  GroupList,
  useTheme,
  Icons,
  Button,
  Pressable
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { Space } from 'common/components/Space'
import { LoadingState } from 'common/components/LoadingState'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { ErrorState } from 'common/components/ErrorState'
import Logger from 'utils/Logger'
import { useSearchPaymentMethods } from '../hooks/useSearchPaymentMethods'
import {
  PaymentMethodNames,
  ServiceProviderCategories,
  PaymentMethodTimeLimits,
  PaymentMethods
} from '../consts'
import { useMeldPaymentMethod } from '../store'
import { useServiceProviders } from '../hooks/useServiceProviders'
import { PaymentMethodIcon } from './PaymentMethodIcon'

export const SelectPaymentMethod = ({
  category,
  title,
  onSelectServiceProvider
}: {
  category: ServiceProviderCategories
  title: string
  onSelectServiceProvider: () => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const [meldPaymentMethod, setMeldPaymentMethod] = useMeldPaymentMethod()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    PaymentMethods | undefined
  >(meldPaymentMethod)
  const {
    data: paymentMethods,
    isLoading: isLoadingPaymentMethods,
    error: paymentMethodsError
  } = useSearchPaymentMethods({
    categories: [category]
  })

  const isOnramp = category === ServiceProviderCategories.CRYPTO_ONRAMP

  const { crytoQuotes } = useServiceProviders({
    enabled: !isOnramp,
    category
  })

  const supportedPaymentMethods = useMemo(() => {
    if (isOnramp) {
      return paymentMethods
    }

    return paymentMethods?.filter(paymentMethod =>
      crytoQuotes?.some(
        quote => quote.paymentMethodType === paymentMethod.paymentMethod
      )
    )
  }, [isOnramp, paymentMethods, crytoQuotes])

  const dismissPaymentMethod = useCallback(() => {
    setMeldPaymentMethod(selectedPaymentMethod)
    canGoBack() && back()
  }, [back, canGoBack, selectedPaymentMethod, setMeldPaymentMethod])

  const renderHeader = useCallback(() => {
    return (
      <View>
        <Pressable
          onPress={onSelectServiceProvider}
          sx={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12,
            justifyContent: 'space-between',
            padding: 17,
            backgroundColor: colors.$surfaceSecondary
          }}>
          <Text
            variant="body1"
            sx={{
              fontSize: 16,
              lineHeight: 22,
              fontWeight: 400,
              color: colors.$textPrimary
            }}>
            Change provider
          </Text>
          <View sx={{ marginLeft: 8 }}>
            <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
          </View>
        </Pressable>
        {isOnramp && (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 39,
              marginRight: 32
            }}>
            <Icons.Action.Info color={colors.$textPrimary} />
            <Text variant="body1" sx={{ color: colors.$textPrimary }}>
              When using Apple Pay or Google Pay, payments made with credit
              cards are more likely to succeed
            </Text>
          </View>
        )}
      </View>
    )
  }, [
    isOnramp,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    onSelectServiceProvider
  ])

  const renderFooter = useCallback(() => {
    // TODO: go to webview screen or go to amount screen
    return (
      <Button type="primary" size="large" onPress={dismissPaymentMethod}>
        Next
      </Button>
    )
  }, [dismissPaymentMethod])

  const data = useMemo(() => {
    if (!supportedPaymentMethods) return []

    return supportedPaymentMethods.map(paymentMethod => {
      return {
        title: paymentMethod.paymentMethod
          ? PaymentMethodNames[paymentMethod.paymentMethod]
          : '',
        subtitle: paymentMethod.paymentMethod
          ? PaymentMethodTimeLimits[paymentMethod.paymentMethod]
          : '',
        onPress: () => {
          if (paymentMethod.paymentMethod) {
            setSelectedPaymentMethod(paymentMethod.paymentMethod)
            setMeldPaymentMethod(paymentMethod.paymentMethod)
          }
        },
        accessory:
          selectedPaymentMethod === paymentMethod.paymentMethod ? (
            <Icons.Custom.CheckSmall color={colors.$textPrimary} />
          ) : (
            <></>
          ),
        leftIcon: <PaymentMethodIcon paymentMethod={paymentMethod} />
      }
    })
  }, [
    supportedPaymentMethods,
    selectedPaymentMethod,
    colors.$textPrimary,
    setMeldPaymentMethod
  ])

  useEffect(() => {
    if (data.length === 0) {
      Logger.error('[SelectPaymentMethod] No payment methods available')
    }
  }, [data])

  const renderContent = useCallback(() => {
    if (isLoadingPaymentMethods) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }
    if (paymentMethodsError) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
          title="Unable to load payment methods"
          description="Please try again later"
        />
      )
    }
    if (data.length === 0) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
          title="No payment methods available"
          description="Try a different token or amount"
        />
      )
    }

    return <GroupList data={data} subtitleVariant="body1" />
  }, [data, isLoadingPaymentMethods, paymentMethodsError])

  return (
    <ScrollScreen
      isModal
      title={title}
      renderHeader={renderHeader}
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16
      }}>
      <Space y={21} />
      {renderContent()}
    </ScrollScreen>
  )
}
