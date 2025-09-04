import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { TokenUnit, truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Icons,
  Pressable,
  SCREEN_WIDTH,
  SendTokenUnitInputWidget,
  SendTokenUnitInputWidgetHandle,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { loadAvatar } from 'common/utils/loadAvatar'
import { useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { xpAddressWithoutPrefix } from 'common/utils/xpAddressWIthoutPrefix'
import { usePrevious } from 'common/hooks/usePrevious'
import { MINIMUM_SATOSHI_SEND_AMOUNT } from 'consts/amount'
import { useSendContext } from '../context/sendContext'
import { useSendSelectedToken } from '../store'

export const SendToken = ({ onSend }: { onSend: () => void }): JSX.Element => {
  const {
    recipient,
    setError,
    toAddress,
    addressToSend,
    setCanValidate,
    isSending,
    network,
    amount,
    setAmount,
    resetAmount
  } = useSendContext()

  const { navigate } = useRouter()
  const [selectedToken] = useSendSelectedToken()
  const prevSelectedToken = usePrevious(selectedToken)
  const { getMarketTokenBySymbol } = useWatchlist()
  const {
    theme: { colors }
  } = useTheme()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [isTokenTouched, setIsTokenTouched] = useState(false)
  const [isAmountTouched, setIsAmountTouched] = useState(false)

  const tokenUnitInputWidgetRef = useRef<SendTokenUnitInputWidgetHandle>(null)

  useEffect(() => {
    if (prevSelectedToken !== selectedToken) {
      resetAmount()
      tokenUnitInputWidgetRef.current?.setValue('')
    }
  }, [prevSelectedToken, selectedToken, resetAmount])

  useEffect(() => {
    if (!isTokenTouched && selectedToken) {
      setIsTokenTouched(true)
    }
  }, [selectedToken, isTokenTouched])

  useEffect(() => {
    if (!isAmountTouched && amount) {
      setIsAmountTouched(true)
    }
  }, [amount, isAmountTouched])

  const isAllFieldsTouched = useMemo(
    () => isTokenTouched && isAmountTouched,
    [isTokenTouched, isAmountTouched]
  )

  useEffect(() => {
    setCanValidate(isAllFieldsTouched)
  }, [isAllFieldsTouched, setCanValidate])

  const tokenBalance = useMemo(() => {
    if (selectedToken === undefined) {
      return undefined
    }
    if (
      isTokenWithBalancePVM(selectedToken) ||
      isTokenWithBalanceAVM(selectedToken)
    ) {
      return new TokenUnit(
        selectedToken.available ?? 0,
        selectedToken && 'decimals' in selectedToken
          ? selectedToken.decimals
          : network.networkToken.decimals,
        selectedToken?.symbol ?? ''
      )
    }

    return new TokenUnit(
      selectedToken?.balance ?? 0,
      selectedToken && 'decimals' in selectedToken
        ? selectedToken.decimals
        : network.networkToken.decimals,
      selectedToken?.symbol ?? ''
    )
  }, [network.networkToken.decimals, selectedToken])

  const addressToSendWithoutPrefix = useMemo(() => {
    if (selectedToken === undefined && toAddress?.recipientType !== 'address') {
      return undefined
    }
    if (
      selectedToken &&
      addressToSend &&
      (isTokenWithBalancePVM(selectedToken) ||
        isTokenWithBalanceAVM(selectedToken))
    ) {
      return xpAddressWithoutPrefix(addressToSend)
    }
    return addressToSend
  }, [addressToSend, selectedToken, toAddress?.recipientType])

  const canSubmit =
    !isSending &&
    amount &&
    amount.gt(0) &&
    selectedToken !== undefined &&
    addressToSend !== undefined &&
    tokenBalance &&
    (amount.lt(tokenBalance) || amount?.eq(tokenBalance)) &&
    ((selectedToken?.symbol === 'BTC' &&
      amount.toSubUnit() >= MINIMUM_SATOSHI_SEND_AMOUNT) ||
      selectedToken?.symbol !== 'BTC')

  const handleSelectToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/selectSendToken', params: toAddress })
  }, [navigate, toAddress])

  const validateSendAmount = useCallback(
    async (amt: TokenUnit) => {
      if (tokenBalance && amt.gt(tokenBalance)) {
        setError('The specified send amount exceeds the available balance')
        throw new Error(
          'The specified send amount exceeds the available balance'
        )
      }
      if (
        amt.toSubUnit() < MINIMUM_SATOSHI_SEND_AMOUNT &&
        selectedToken?.symbol === 'BTC'
      ) {
        setError('The specified send amount is too low')
        throw new Error('The specified send amount is too low')
      }
    },
    [setError, tokenBalance, selectedToken?.symbol]
  )

  const formatInCurrency = useCallback(
    (amt: TokenUnit, symbol: string): string => {
      const currentPrice = getMarketTokenBySymbol(symbol)?.currentPrice ?? 0
      return amt.mul(currentPrice).toDisplay() + ' ' + selectedCurrency
    },
    [getMarketTokenBySymbol, selectedCurrency]
  )

  const recipientAvatar = useMemo(() => {
    return loadAvatar(recipient?.avatar)
  }, [recipient?.avatar])

  const renderFooter = useCallback(() => {
    return (
      <View
        style={{
          gap: 20
        }}>
        <Button
          testID={canSubmit ? 'next_btn' : 'next_btn_disabled'}
          disabled={!canSubmit}
          type="primary"
          size="large"
          onPress={onSend}>
          {isSending ? <ActivityIndicator size="small" /> : 'Next'}
        </Button>
      </View>
    )
  }, [canSubmit, isSending, onSend])

  return (
    <ScrollScreen
      bottomOffset={150}
      isModal
      title={`${'How much would\nyou like to send?'}`}
      navigationTitle="How much would you like to send?"
      renderFooter={renderFooter}
      shouldAvoidKeyboard
      contentContainerStyle={{
        padding: 16
      }}>
      <Card
        sx={{
          marginTop: 22,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 12,
          justifyContent: 'space-between',
          width: '100%'
        }}>
        <Text variant="body1" sx={{ fontSize: 16, lineHeight: 22 }}>
          Send to
        </Text>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            flex: 1
          }}>
          <View
            sx={{
              alignItems: 'flex-end',
              width: SCREEN_WIDTH * 0.5
            }}>
            {recipient?.name && (
              <Text
                variant="body1"
                numberOfLines={1}
                sx={{
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.$textPrimary
                }}>
                {recipient.name}
              </Text>
            )}
            {addressToSendWithoutPrefix && (
              <Text
                variant="mono"
                numberOfLines={1}
                sx={{
                  fontSize: 13,
                  color: colors.$textSecondary
                }}>
                {truncateAddress(
                  addressToSendWithoutPrefix,
                  TRUNCATE_ADDRESS_LENGTH
                )}
              </Text>
            )}
          </View>
          {recipientAvatar?.source !== undefined && (
            <Avatar
              backgroundColor="transparent"
              size={40}
              source={recipientAvatar?.source}
              hasLoading={false}
            />
          )}
        </View>
      </Card>
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
          testID="send_select_token_list_btn"
          variant="body1"
          sx={{ fontSize: 16, lineHeight: 22, color: colors.$textPrimary }}>
          Token
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {selectedToken && 'isDataAccurate' in selectedToken && (
            <>
              <LogoWithNetwork
                token={selectedToken}
                outerBorderColor={colors.$surfaceSecondary}
              />
              <Text
                variant="body1"
                sx={{
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.$textSecondary
                }}>
                {selectedToken.symbol}
              </Text>
            </>
          )}
          <View sx={{ marginLeft: 8 }}>
            <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
          </View>
        </View>
      </Pressable>

      {/* Token amount input widget */}
      {tokenBalance && (
        <SendTokenUnitInputWidget
          ref={tokenUnitInputWidgetRef}
          sx={{ marginTop: 12 }}
          amount={amount}
          token={{
            maxDecimals:
              selectedToken && 'decimals' in selectedToken
                ? selectedToken.decimals
                : 0,
            symbol: selectedToken?.symbol ?? ''
          }}
          balance={tokenBalance}
          formatInCurrency={amt =>
            formatInCurrency(amt, selectedToken?.symbol ?? '')
          }
          onChange={setAmount}
          validateAmount={validateSendAmount}
          disabled={isSending || selectedToken === undefined}
          autoFocus
        />
      )}
    </ScrollScreen>
  )
}
