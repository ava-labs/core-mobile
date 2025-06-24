import { GroupList, GroupListItem, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { TokenLogo } from 'common/components/TokenLogo'
import { Space } from 'common/components/Space'
import { TokenSymbol } from 'store/network'
import { LoadingState } from 'common/components/LoadingState'
import { LogoWithNetwork } from 'common/components/LogoWithNetwork'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAvalancheErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { USDC_AVALANCHE_C_TOKEN_ID } from 'common/consts/swap'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { useBuy } from '../hooks/useBuy'

export const BuyTokenScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()
  const cChainNetwork = useCChainNetwork()
  const { navigateToBuyAvax, navigateToBuyUsdc, isLoadingCryptoCurrencies } =
    useBuy()
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: avalancheErc20ContractTokens,
    hideZeroBalance: false
  })

  const usdcAvalancheToken = filteredTokenList.find(
    token =>
      'chainId' in token &&
      token.chainId &&
      isAvalancheChainId(token.chainId) &&
      token.address.toLowerCase() === USDC_AVALANCHE_C_TOKEN_ID.toLowerCase()
  )

  const selectOtherToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectBuyToken')
  }, [navigate])

  const data = useMemo(() => {
    const _data: GroupListItem[] = [
      {
        title: TokenSymbol.AVAX,
        leftIcon: <TokenLogo symbol={TokenSymbol.AVAX} />,
        onPress: navigateToBuyAvax
      }
    ]

    if (cChainNetwork && usdcAvalancheToken) {
      _data.push({
        title: TokenSymbol.USDC,
        leftIcon: (
          <LogoWithNetwork
            size="small"
            token={usdcAvalancheToken}
            network={cChainNetwork}
            outerBorderColor={colors.$surfacePrimary}
          />
        ),
        onPress: navigateToBuyUsdc
      })
    }
    _data.push({
      title: 'Select other token',
      onPress: selectOtherToken
    })

    return _data
  }, [
    cChainNetwork,
    colors.$surfacePrimary,
    navigateToBuyAvax,
    navigateToBuyUsdc,
    selectOtherToken,
    usdcAvalancheToken
  ])

  return (
    <ScrollScreen
      title={`What token do\nyou want to buy?`}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
      <Space y={16} />
      {isLoadingCryptoCurrencies ? (
        <LoadingState sx={{ flexGrow: 1 }} />
      ) : (
        <GroupList
          data={data}
          titleSx={{
            fontFamily: 'Inter-Regular',
            fontSize: 16,
            lineHeight: 22,
            fontWeight: 500
          }}
          textContainerSx={{
            paddingVertical: 4
          }}
          separatorMarginRight={16}
        />
      )}
    </ScrollScreen>
  )
}
