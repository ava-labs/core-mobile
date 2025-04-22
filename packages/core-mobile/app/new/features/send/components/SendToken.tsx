import React, { useCallback, useMemo, useState, useEffect } from 'react'
import {
  Avatar,
  Button,
  Card,
  Icons,
  Pressable,
  SafeAreaView,
  SendTokenUnitInputWidget,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { TokenUnit, truncateAddress } from '@avalabs/core-utils-sdk'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { AddrBookItemType } from 'store/addressBook'
import { useSendContext } from '../context/sendContext'
import { useSendSelectedToken } from '../store'

export const SendToken = ({ onSend }: { onSend: () => void }): JSX.Element => {
  const { to, recipientType } = useLocalSearchParams<{
    to: string // accountIndex | contactUID | address
    recipientType: AddrBookItemType | 'address'
  }>()
  const {
    setToAddress,
    recipient,
    setError,
    addressToSend,
    setCanValidate,
    isSending,
    network,
    amount,
    setAmount
  } = useSendContext()

  const { navigate } = useRouter()
  const [selectedToken] = useSendSelectedToken()
  const { getMarketTokenBySymbol } = useWatchlist()
  const {
    theme: { colors }
  } = useTheme()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [isTokenTouched, setIsTokenTouched] = useState(false)
  const [isAmountTouched, setIsAmountTouched] = useState(false)

  useFocusEffect(
    useCallback(() => {
      setToAddress({ to, recipientType })
    }, [recipientType, setToAddress, to])
  )

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

  const canSubmit =
    !isSending && amount && amount.gt(0) && selectedToken !== undefined

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

  const handleSelectToken = useCallback((): void => {
    navigate({ pathname: '/selectSendToken', params: { to, recipientType } })
  }, [navigate, recipientType, to])

  const validateSendAmount = useCallback(
    async (amt: TokenUnit) => {
      if (tokenBalance && amt.gt(tokenBalance)) {
        setError('The specified send amount exceeds the available balance')
        throw new Error(
          'The specified send amount exceeds the available balance'
        )
      }
    },
    [setError, tokenBalance]
  )

  const formatInCurrency = useCallback(
    (amt: TokenUnit, symbol: string): string => {
      const currentPrice = getMarketTokenBySymbol(symbol)?.currentPrice ?? 0
      return amt.mul(currentPrice).toDisplay() + ' ' + selectedCurrency
    },
    [getMarketTokenBySymbol, selectedCurrency]
  )

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'space-between',
        marginHorizontal: 16
      }}>
      <KeyboardAwareScrollView>
        <Text variant="heading2" style={{ marginBottom: 12 }}>
          {`${'How much would\nyou like to send?'}`}
        </Text>
        {/* Send to */}
        <Card
          sx={{
            marginTop: 22,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12,
            justifyContent: 'space-between'
          }}>
          <Text variant="body1" sx={{ fontSize: 16, lineHeight: 22 }}>
            Send to
          </Text>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}>
            <View sx={{ alignItems: 'flex-end' }}>
              {recipient?.name && (
                <Text
                  variant="body1"
                  sx={{
                    fontSize: 16,
                    lineHeight: 22,
                    color: colors.$textPrimary
                  }}>
                  {recipient.name}
                </Text>
              )}
              {addressToSend && (
                <Text
                  variant="mono"
                  sx={{
                    fontSize: 13,
                    color: colors.$textSecondary
                  }}>
                  {truncateAddress(addressToSend)}
                </Text>
              )}
            </View>
            <Avatar
              backgroundColor="transparent"
              size={40}
              // todo: replace with actual avatar
              source={{
                uri: 'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
              }}
              hasLoading={false}
            />
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
            variant="body1"
            sx={{ fontSize: 16, lineHeight: 22, color: colors.$textPrimary }}>
            Token
          </Text>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {selectedToken && (
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
          />
        )}
      </KeyboardAwareScrollView>

      {/* Send */}
      <Button
        disabled={!canSubmit}
        style={{ marginBottom: 16 }}
        type="primary"
        size="large"
        onPress={onSend}>
        Send
      </Button>
    </SafeAreaView>
  )
}
