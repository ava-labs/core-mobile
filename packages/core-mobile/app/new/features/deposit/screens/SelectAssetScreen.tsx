import React, { useCallback } from 'react'
import { ListScreen } from 'common/components/ListScreen'
import {
  Button,
  Image,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useRouter } from 'expo-router'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { AVAX_TOKEN_ID } from 'common/consts/swap'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useDepositableTokens } from '../hooks/useDepositableTokens'
import errorIcon from '../../../assets/icons/melting_face.png'
import { DefiAssetDetails } from '../types'
import { DefiAssetLogo } from '../components/DefiAssetLogo'
import { findMatchingTokenWithBalance } from '../utils/findMatchingTokenWithBalance'

export const SelectAssetScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { tokens, isPending } = useDepositableTokens()
  const {
    theme: { colors }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { navigateToBuy, isBuyable } = useBuy()
  const { navigateToSwap } = useNavigateToSwap()
  const cChainNetwork = useCChainNetwork()
  const activeAccount = useSelector(selectActiveAccount)
  const tokensWithBalance = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    cChainNetwork?.chainId
  )

  const handleSelectToken = useCallback(
    (marketAsset: DefiAssetDetails) => {
      const token = findMatchingTokenWithBalance(marketAsset, tokensWithBalance)

      if (token) {
        navigate({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/deposit/selectPool',
          params: {
            contractAddress: marketAsset.contractAddress,
            symbol: marketAsset.symbol
          }
        })
      } else if (isBuyable(undefined, marketAsset.contractAddress)) {
        navigateToBuy({
          showAvaxWarning: true,
          address: marketAsset.contractAddress
        })
      } else {
        navigateToSwap(AVAX_TOKEN_ID, marketAsset.contractAddress)
      }
    },
    [navigate, navigateToBuy, isBuyable, navigateToSwap, tokensWithBalance]
  )

  const renderItem = useCallback(
    ({ item }: { item: DefiAssetDetails }) => {
      return (
        <TouchableOpacity onPress={() => handleSelectToken(item)}>
          <View
            sx={{
              marginHorizontal: 16,
              marginTop: 10,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: colors.$surfaceSecondary,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}>
            <DefiAssetLogo
              asset={item}
              network={item.contractAddress ? cChainNetwork : undefined}
            />
            <View sx={{ flex: 1 }}>
              <Text
                variant="body2"
                sx={{ color: colors.$textPrimary, fontWeight: 500 }}>
                {item.symbol}
              </Text>
              <Text
                variant="subtitle2"
                sx={{ color: colors.$textSecondary, fontWeight: 500 }}>
                {item.underlyingTokenBalance?.balanceInCurrency
                  ? formatCurrency({
                      amount: item.underlyingTokenBalance.balanceInCurrency
                    })
                  : UNKNOWN_AMOUNT}
              </Text>
            </View>
            <Button
              type="secondary"
              size="small"
              onPress={() => handleSelectToken(item)}>
              {item.underlyingTokenBalance?.balanceInCurrency
                ? 'Deposit'
                : 'Buy'}
            </Button>
          </View>
        </TouchableOpacity>
      )
    },
    [colors, formatCurrency, handleSelectToken, cChainNetwork]
  )

  const renderEmpty = useCallback(() => {
    if (isPending) {
      return <LoadingState sx={{ flex: 1 }} />
    }
    return (
      <ErrorState
        sx={{ flex: 1 }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No assets found"
        description=""
      />
    )
  }, [isPending])

  return (
    <ListScreen
      title="Select an asset to deposit"
      data={tokens}
      renderItem={renderItem}
      renderEmpty={renderEmpty}
      keyExtractor={item => item.symbol}
    />
  )
}
