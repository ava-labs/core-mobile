import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Button,
  SendTokenUnitInputWidget,
  SendTokenUnitInputWidgetHandle,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { usePrevious } from 'common/hooks/usePrevious'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useDepositSelectedMarket, useDepositSelectedToken } from '../store'

export const SelectAmountScreen = (): JSX.Element => {
  const cchainNetwork = useCChainNetwork()
  const [amount, setAmount] = useState<TokenUnit>()
  const [isSubmitting] = useState(false)
  const [selectedToken] = useDepositSelectedToken()
  const prevSelectedToken = usePrevious(selectedToken)
  const [selectedMarket] = useDepositSelectedMarket()
  const tokenUnitInputWidgetRef = useRef<SendTokenUnitInputWidgetHandle>(null)
  const { getMarketTokenBySymbol } = useWatchlist()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const tokenBalance = useMemo(() => {
    if (!selectedToken || !cchainNetwork) {
      return undefined
    }

    const decimals =
      'decimals' in selectedToken
        ? selectedToken.decimals
        : cchainNetwork.networkToken.decimals

    return new TokenUnit(
      selectedToken.balance ?? 0n,
      decimals,
      selectedToken.symbol
    )
  }, [cchainNetwork, selectedToken])

  const formatInCurrency = useCallback(
    (amt: TokenUnit, symbol: string): string => {
      const currentPrice = getMarketTokenBySymbol(symbol)?.currentPrice ?? 0
      return amt.mul(currentPrice).toDisplay() + ' ' + selectedCurrency
    },
    [getMarketTokenBySymbol, selectedCurrency]
  )

  const handleNext = useCallback(() => {
    if (!selectedMarket) {
      return
    }
    // TODO
  }, [selectedMarket])

  const canSubmit =
    !isSubmitting &&
    amount &&
    amount.gt(0) &&
    selectedToken !== undefined &&
    selectedMarket !== undefined &&
    tokenBalance &&
    (amount.lt(tokenBalance) || amount?.eq(tokenBalance))

  const renderFooter = useCallback(() => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={handleNext}
        disabled={!canSubmit}>
        {isSubmitting ? <ActivityIndicator size="small" /> : 'Next'}
      </Button>
    )
  }, [handleNext, isSubmitting, canSubmit])

  const validateSendAmount = useCallback(
    async (amt: TokenUnit) => {
      if (tokenBalance && amt.gt(tokenBalance)) {
        throw new Error(
          'The specified send amount exceeds the available balance'
        )
      }
    },
    [tokenBalance]
  )

  useEffect(() => {
    if (prevSelectedToken !== selectedToken) {
      setAmount(undefined)
      tokenUnitInputWidgetRef.current?.setValue('')
    }
  }, [prevSelectedToken, selectedToken])

  return (
    <ScrollScreen
      title={`How much do you want to deposit?`}
      titleSx={{ maxWidth: '80%' }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0
      }}
      renderFooter={renderFooter}>
      <View sx={{ flex: 1 }}>
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
            disabled={isSubmitting || selectedToken === undefined}
            autoFocus
            presetPercentages={[25, 50]}
          />
        )}
      </View>
    </ScrollScreen>
  )
}
