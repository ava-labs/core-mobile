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
import { useNavigation } from '@react-navigation/native'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { AVAX_TOKEN_ID } from 'common/consts/swap'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { selectActiveAccount } from 'store/account'
import { useSelector } from 'react-redux'
import { TokenType } from '@avalabs/vm-module-types'
import errorIcon from '../../../../assets/icons/melting_face.png'
import { DefiAssetDetails } from '../../types'
import { DefiAssetLogo } from '../../components/DefiAssetLogo'
import { findMatchingTokenWithBalance } from '../../utils/findMatchingTokenWithBalance'
import { useDepositSelectedAsset } from '../../store'
import { useAvailableMarkets } from '../../hooks/useAvailableMarkets'
import { useDepositableTokens } from '../../hooks/useDepositableTokens'

export const SelectAssetScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const navigation = useNavigation()
  const activeAccount = useSelector(selectActiveAccount)
  const cChainNetwork = useCChainNetwork()
  const cChainTokensWithBalance = useTokensWithBalanceForAccount({
    account: activeAccount,
    chainId: cChainNetwork?.chainId
  })
  const { data: markets, isPending: isLoadingMarkets } = useAvailableMarkets()
  const depositableTokens = useDepositableTokens(
    markets,
    cChainTokensWithBalance
  )
  const {
    theme: { colors }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { navigateToSwap } = useNavigateToSwap()
  const [, setSelectedAsset] = useDepositSelectedAsset()

  const handleSelectToken = useCallback(
    (marketAsset: DefiAssetDetails) => {
      const token = findMatchingTokenWithBalance(
        marketAsset,
        cChainTokensWithBalance
      )
      const nativeToken = cChainTokensWithBalance.find(
        t => t.type === TokenType.NATIVE
      )
      if (token && token.balance > 0n) {
        setSelectedAsset({ token, nativeToken })

        navigate({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/deposit/selectPool',
          params: {
            contractAddress: marketAsset.contractAddress,
            symbol: marketAsset.symbol
          }
        })
      } else {
        // Dismiss entire deposit modal and navigate to swap
        navigation.getParent()?.goBack()
        navigateToSwap(AVAX_TOKEN_ID, marketAsset.contractAddress)
      }
    },
    [
      navigate,
      navigation,
      navigateToSwap,
      cChainTokensWithBalance,
      setSelectedAsset
    ]
  )

  const renderItem = useCallback(
    ({ item }: { item: DefiAssetDetails }) => {
      const tokenWithBalance = findMatchingTokenWithBalance(
        item,
        cChainTokensWithBalance
      )

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
                {tokenWithBalance?.balanceInCurrency
                  ? formatCurrency({
                      amount: tokenWithBalance.balanceInCurrency
                    })
                  : UNKNOWN_AMOUNT}
              </Text>
            </View>
            <Button
              type="secondary"
              size="small"
              testID={`depositOrBuy__${item.symbol}`}
              onPress={() => handleSelectToken(item)}>
              {tokenWithBalance?.balance !== undefined &&
              tokenWithBalance.balance > 0n
                ? 'Deposit'
                : 'Buy'}
            </Button>
          </View>
        </TouchableOpacity>
      )
    },
    [
      colors,
      formatCurrency,
      handleSelectToken,
      cChainNetwork,
      cChainTokensWithBalance
    ]
  )

  const renderEmpty = useCallback(() => {
    if (isLoadingMarkets) {
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
  }, [isLoadingMarkets])

  return (
    <ListScreen
      title="Select an asset to deposit"
      isModal
      data={depositableTokens}
      renderItem={renderItem}
      renderEmpty={renderEmpty}
      keyExtractor={item => item.symbol}
    />
  )
}
