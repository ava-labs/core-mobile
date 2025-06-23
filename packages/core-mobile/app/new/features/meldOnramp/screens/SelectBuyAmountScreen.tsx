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
  ActivityIndicator,
  showAlert
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
    formatInTokenUnit,
    sourceAmount,
    setSourceAmount,
    paymentMethodToDisplay,
    serviceProviderToDisplay,
    isBuyAllowed,
    token,
    tokenBalance,
    hasValidSourceAmount,
    isLoadingDefaultsByCountry,
    isLoadingPurchaseLimits,
    createSessionWidget,
    isLoadingCryptoQuotes,
    errorMessage
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
    if (sourceAmount === undefined || sourceAmount === 0) {
      showAlert({
        title: 'Please enter an amount',
        buttons: [
          {
            text: 'OK'
          }
        ]
      })
      return
    }

    // @ts-ignore TODO: make routes typesafe
    navigate('/selectPaymentMethod')
  }, [navigate, sourceAmount])

  const onNext = useCallback(async (): Promise<void> => {
    const sessionWidget = await createSessionWidget()
    sessionWidget?.widgetUrl && openUrl(sessionWidget.widgetUrl)
  }, [createSessionWidget, openUrl])

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
          Buy
        </Button>
      </View>
    )
  }, [onNext, isBuyAllowed])

  const renderServiceProvider = useCallback(() => {
    if (!hasValidSourceAmount) {
      return
    }

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
  }, [
    colors.$textPrimary,
    hasValidSourceAmount,
    isLoadingCryptoQuotes,
    serviceProviderToDisplay
  ])

  const renderPayWith = useCallback(() => {
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
          isAmountValid={errorMessage === undefined}
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
      {errorMessage && (
        <View
          sx={{
            alignItems: 'center',
            marginTop: 12,
            marginHorizontal: 16,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
          }}>
          <Icons.Alert.AlertCircle color={colors.$textDanger} />
          <Text
            variant="caption"
            sx={{ fontWeight: 500, color: colors.$textDanger }}>
            {errorMessage}
          </Text>
        </View>
      )}
      {/* Pay with */}
      {renderPayWith()}
    </ScrollScreen>
  )
}
