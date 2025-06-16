import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback } from 'react'
import {
  Button,
  View,
  Text,
  Icons,
  Pressable,
  useTheme,
  FiatAmountInputWidget,
  ActivityIndicator
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { useSelectBuyAmount } from '../hooks/useSelectBuyAmount'

export const SelectBuyAmountScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const {
    minimumPurchaseLimit,
    maximumPurchaseLimit,
    formatInTokenUnit,
    sourceAmount,
    setSourceAmount,
    paymentMethodToDisplay,
    serviceProviderToDisplay,
    isBuyAllowed,
    token,
    tokenBalance,
    isAboveMinimumPurchaseLimit,
    isBelowMaximumPurchaseLimit,
    isLoadingDefaultsByCountry,
    isLoadingPurchaseLimits,
    widgetUrl
  } = useSelectBuyAmount()
  const { openUrl } = useInAppBrowser()
  const { formatIntegerCurrency, formatCurrency } = useFormatCurrency()
  const { navigate } = useRouter()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const handleSelectToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectBuyToken')
  }, [navigate])

  const handleSelectPaymentMethod = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectPaymentMethod')
  }, [navigate])

  const onNext = useCallback((): void => {
    widgetUrl && openUrl(widgetUrl)
  }, [openUrl, widgetUrl])

  const renderFooter = useCallback(() => {
    return (
      <View
        style={{
          gap: 20
        }}>
        <Button
          disabled={!isBuyAllowed}
          type="primary"
          size="large"
          onPress={onNext}>
          Next
        </Button>
      </View>
    )
  }, [onNext, isBuyAllowed])

  const renderServiceProvider = useCallback(() => {
    if (isLoadingCryptoQuotes) {
      return <ActivityIndicator size="small" color={colors.$textPrimary} />
    }

    if (serviceProviderToDisplay) {
      return (
        <Text
          variant="caption"
          sx={{
            fontSize: 11,
            fontWeight: 500,
            textAlign: 'right'
          }}>
          {serviceProviderToDisplay}
        </Text>
      )
    }
  }, [colors.$textPrimary, isLoadingCryptoQuotes, serviceProviderToDisplay])

  const renderPayWith = useCallback(() => {
    if (
      !sourceAmount ||
      isAboveMinimumPurchaseLimit === false ||
      isBelowMaximumPurchaseLimit === false
    ) {
      return null
    }

    return (
      paymentMethodToDisplay && (
        <Pressable
          onPress={handleSelectPaymentMethod}
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
            Pay with
          </Text>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isLoadingDefaultsByCountry ? (
              <ActivityIndicator size="small" color={colors.$textPrimary} />
            ) : (
              <>
                <View sx={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                  <Text
                    variant="body2"
                    sx={{
                      fontSize: 16,
                      lineHeight: 22,
                      fontWeight: 400,
                      textAlign: 'right'
                    }}>
                    {paymentMethodToDisplay}
                  </Text>
                  {renderServiceProvider()}
                </View>
                <View sx={{ marginLeft: 8 }}>
                  <Icons.Navigation.ChevronRightV2
                    color={colors.$textPrimary}
                  />
                </View>
              </>
            )}
          </View>
        </Pressable>
      )
    )
  }, [
    sourceAmount,
    isAboveMinimumPurchaseLimit,
    isBelowMaximumPurchaseLimit,
    paymentMethodToDisplay,
    handleSelectPaymentMethod,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    isLoadingDefaultsByCountry,
    renderServiceProvider
  ])

  return (
    <ScrollScreen
      bottomOffset={150}
      isModal
      title={`${'How much do\nyou like to buy?'}`}
      navigationTitle="Enter buy amount"
      renderFooter={renderFooter}
      shouldAvoidKeyboard
      contentContainerStyle={{
        padding: 16
      }}>
      {/* Select Token */}
      <Pressable
        onPress={handleSelectToken}
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
          sx={{ fontSize: 16, lineHeight: 22, color: colors.$textPrimary }}>
          Token
        </Text>
        {token?.tokenWithBalance ? (
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LogoWithNetwork
              token={token.tokenWithBalance}
              outerBorderColor={colors.$surfaceSecondary}
            />
            <Text
              variant="body1"
              sx={{
                fontSize: 16,
                lineHeight: 22,
                color: colors.$textSecondary
              }}>
              {token?.tokenWithBalance?.symbol}
            </Text>
            <View sx={{ marginLeft: 8 }}>
              <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
            </View>
          </View>
        ) : (
          <ActivityIndicator size="small" color={colors.$textPrimary} />
        )}
      </Pressable>

      {/* Fiat amount input widget */}
      {tokenBalance && (
        <FiatAmountInputWidget
          isAmountValid={
            isBelowMaximumPurchaseLimit && isAboveMinimumPurchaseLimit
          }
          disabled={isLoadingPurchaseLimits}
          sx={{ marginTop: 12 }}
          currency={selectedCurrency}
          amount={sourceAmount}
          onChange={setSourceAmount}
          formatIntegerCurrency={amt =>
            formatIntegerCurrency({ amount: amt, withoutCurrencySuffix: true })
          }
          formatInCurrency={amt => formatCurrency({ amount: amt })}
          formatInTokenUnit={formatInTokenUnit}
        />
      )}
      <View sx={{ alignItems: 'center', marginTop: 12 }}>
        {isAboveMinimumPurchaseLimit === false &&
          minimumPurchaseLimit &&
          sourceAmount !== 0 && (
            <Text
              variant="caption"
              sx={{
                fontWeight: 500,
                color: colors.$textDanger
              }}>{`The minimum purchase amount is ${minimumPurchaseLimit} ${selectedCurrency}`}</Text>
          )}
        {isBelowMaximumPurchaseLimit === false &&
          maximumPurchaseLimit &&
          sourceAmount !== 0 && (
            <Text
              variant="caption"
              sx={{
                fontWeight: 500,
                color: colors.$textDanger
              }}>{`The maximum purchase amount is ${maximumPurchaseLimit} ${selectedCurrency}`}</Text>
          )}
      </View>
      {/* Pay with */}
      {renderPayWith()}
    </ScrollScreen>
  )
}
