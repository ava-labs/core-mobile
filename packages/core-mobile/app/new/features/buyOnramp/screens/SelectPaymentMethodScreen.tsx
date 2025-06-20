import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo } from 'react'
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
import { useSearchPaymentMethods } from '../hooks/useSearchPaymentMethods'
import { useOnRampPaymentMethod } from '../store'
import {
  PaymentMethodNames,
  ServiceProviderCategories,
  PaymentMethodTimeLimits
} from '../consts'
import { PaymentMethodIcon } from '../components/PaymentMethodIcon'

export const SelectPaymentMethodScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate, back, canGoBack } = useRouter()
  const [onRampPaymentMethod, setOnRampPaymentMethod] = useOnRampPaymentMethod()
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } =
    useSearchPaymentMethods({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
    })

  const handleSelectServiceProvider = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectPaymentMethod/selectServiceProvider')
  }, [navigate])

  const dismissPaymentMethod = useCallback(() => {
    canGoBack() && back()
  }, [back, canGoBack])

  const renderHeader = useCallback(() => {
    return (
      <View>
        <Pressable
          onPress={handleSelectServiceProvider}
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
            When using Apple Pay or Google Pay, payments made with credit cards
            are more likely to succeed
          </Text>
        </View>
      </View>
    )
  }, [
    colors.$surfaceSecondary,
    colors.$textPrimary,
    handleSelectServiceProvider
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
    if (!paymentMethods) return []

    return paymentMethods.map(paymentMethod => {
      return {
        title: paymentMethod.paymentMethod
          ? PaymentMethodNames[paymentMethod.paymentMethod]
          : '',
        subtitle: paymentMethod.paymentMethod
          ? PaymentMethodTimeLimits[paymentMethod.paymentMethod]
          : '',
        onPress: () =>
          setOnRampPaymentMethod(paymentMethod.paymentMethod ?? undefined),
        accessory:
          onRampPaymentMethod === paymentMethod.paymentMethod ? (
            <Icons.Custom.CheckSmall color={colors.$textPrimary} />
          ) : (
            <></>
          ),
        leftIcon: <PaymentMethodIcon paymentMethod={paymentMethod} />
      }
    })
  }, [
    colors.$textPrimary,
    onRampPaymentMethod,
    paymentMethods,
    setOnRampPaymentMethod
  ])

  return (
    <ScrollScreen
      isModal
      title="Pay with"
      renderHeader={renderHeader}
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16
      }}>
      <Space y={21} />
      {isLoadingPaymentMethods ? (
        <LoadingState sx={{ height: portfolioTabContentHeight }} />
      ) : (
        <GroupList data={data} subtitleVariant="body1" />
      )}
    </ScrollScreen>
  )
}
