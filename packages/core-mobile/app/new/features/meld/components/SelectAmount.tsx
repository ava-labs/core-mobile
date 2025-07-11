import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  View,
  Text,
  Icons,
  Pressable,
  useTheme,
  FiatAmountInputWidget,
  ActivityIndicator,
  showAlert,
  useInversedTheme
} from '@avalabs/k2-alpine'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { useSelectAmount } from '../hooks/useSelectAmount'
import { ServiceProviderCategories } from '../consts'
import { useOfframpActivityIndicator, useOfframpSessionId } from '../store'
import { getErrorMessage } from '../utils'

interface SelectAmountProps {
  title: string
  navigationTitle: string
  category: ServiceProviderCategories
  onSelectToken: () => void
  onSelectPaymentMethod: () => void
}

export const SelectAmount = ({
  title,
  navigationTitle,
  category,
  onSelectToken,
  onSelectPaymentMethod
}: SelectAmountProps): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark })
  const { animating } = useOfframpActivityIndicator()

  const {
    formatInSubTextNumber,
    sourceAmount,
    setSourceAmount,
    paymentMethodToDisplay,
    serviceProviderToDisplay,
    isEnabled,
    token,
    tokenBalance,
    hasValidSourceAmount,
    isLoadingDefaultsByCountry,
    isLoadingTradeLimits,
    createSessionWidget,
    isLoadingCryptoQuotes,
    errorMessage
  } = useSelectAmount({ category })
  const { openUrl } = useInAppBrowser()
  const [createSessionWidgetErrorMessage, setCreateSessionWidgetErrorMessage] =
    useState<string | undefined>()
  const [isLoadingCreateSessionWidget, setIsLoadingCreateSessionWidget] =
    useState(false)
  const { setSessionId } = useOfframpSessionId()
  const { formatIntegerCurrency, formatCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { openUrl } = useInAppBrowser()

  useEffect(() => {
    setCreateSessionWidgetErrorMessage(undefined)
  }, [sourceAmount])

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
    onSelectPaymentMethod()
  }, [onSelectPaymentMethod, sourceAmount])

  const onNext = useCallback(async (): Promise<void> => {
    setSessionId(undefined)
    setIsLoadingCreateSessionWidget(true)
    try {
      const sessionWidget = await createSessionWidget()

      if (
        category === ServiceProviderCategories.CRYPTO_OFFRAMP &&
        sessionWidget?.id
      ) {
        // store the session id in the store for the offramp flow
        // this is used to fetch the transaction details from the service provider immediately
        setSessionId(sessionWidget.id)
      }
      sessionWidget?.widgetUrl && openUrl(sessionWidget.widgetUrl)
    } catch (error) {
      const err = getErrorMessage(error as Error)
      setCreateSessionWidgetErrorMessage(err?.message)
    } finally {
      setIsLoadingCreateSessionWidget(false)
    }
  }, [category, createSessionWidget, openUrl, setSessionId])

  const renderFooter = useCallback(() => {
    return (
      <View
        style={{
          gap: 20
        }}>
        <Button
          disabled={!isEnabled}
          type="primary"
          size="large"
          onPress={onNext}>
          {isLoadingCreateSessionWidget ? (
            <ActivityIndicator
              size="small"
              color={inversedTheme.colors.$textPrimary}
            />
          ) : category === ServiceProviderCategories.CRYPTO_ONRAMP ? (
            'Buy'
          ) : (
            'Withdraw'
          )}
        </Button>
      </View>
    )
  }, [
    isEnabled,
    onNext,
    isLoadingCreateSessionWidget,
    inversedTheme.colors.$textPrimary,
    category
  ])

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

  const renderCaption = useCallback(() => {
    if (errorMessage || createSessionWidgetErrorMessage) {
      return (
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
            {errorMessage || createSessionWidgetErrorMessage}
          </Text>
        </View>
      )
    }

    if (tokenBalance && token?.tokenWithBalance.symbol) {
      return (
        <View
          sx={{
            alignItems: 'center',
            marginTop: 12,
            marginHorizontal: 16,
            flexDirection: 'row',
            justifyContent: 'center'
          }}>
          <Text
            variant="caption"
            sx={{
              fontWeight: 500,
              color: colors.$textPrimary
            }}>
            {'Balance: '}
          </Text>
          <SubTextNumber
            number={Number(tokenBalance.toDisplay({ asNumber: true }))}
            textColor={colors.$textPrimary}
            textVariant="caption"
          />
          <Text
            variant="caption"
            sx={{
              fontWeight: 500,
              color: colors.$textPrimary
            }}>
            {' ' + token.tokenWithBalance.symbol}
          </Text>
        </View>
      )
    }
  }, [
    colors.$textDanger,
    colors.$textPrimary,
    errorMessage,
    createSessionWidgetErrorMessage,
    token?.tokenWithBalance.symbol,
    tokenBalance
  ])

  const renderPayWith = useCallback(() => {
    return (
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
          {category === ServiceProviderCategories.CRYPTO_ONRAMP
            ? 'Pay with'
            : 'Withdraw to'}
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isLoadingDefaultsByCountry ? (
            <ActivityIndicator size="small" color={colors.$textPrimary} />
          ) : (
            <>
              <View sx={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                {paymentMethodToDisplay && (
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
                )}
                {renderServiceProvider()}
              </View>
              <View sx={{ marginLeft: 8 }}>
                <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
              </View>
            </>
          )}
        </View>
      </Pressable>
    )
  }, [
    paymentMethodToDisplay,
    handleSelectPaymentMethod,
    colors.$surfaceSecondary,
    colors.$textPrimary,
    category,
    isLoadingDefaultsByCountry,
    renderServiceProvider
  ])

  return (
    <>
      <ScrollScreen
        bottomOffset={150}
        isModal
        title={title}
        navigationTitle={navigationTitle}
        renderFooter={renderFooter}
        shouldAvoidKeyboard
        contentContainerStyle={{
          padding: 16
        }}>
        {/* Select Token */}
        <Pressable
          onPress={onSelectToken}
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
            disabled={isLoadingTradeLimits}
            sx={{ marginTop: 12 }}
            currency={selectedCurrency}
            amount={sourceAmount}
            onChange={setSourceAmount}
            formatIntegerCurrency={amt =>
              formatIntegerCurrency({
                amount: amt,
                withoutCurrencySuffix: true
              })
            }
            formatInCurrency={amt => formatCurrency({ amount: amt })}
            formatInSubTextNumber={formatInSubTextNumber}
          />
        )}
        {/* token balance or error message */}
        {renderCaption()}
        {/* Pay with / Withdraw to */}
        {renderPayWith()}
      </ScrollScreen>
      {animating && (
        <LoadingState
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(40, 40, 46, 0.5)'
          }}
        />
      )}
    </>
  )
}
