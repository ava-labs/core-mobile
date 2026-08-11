import { GroupList, GroupListItem, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenLogo } from 'common/components/TokenLogo'
import { Space } from 'common/components/Space'
import { TokenSymbol } from 'store/network'
import { LoadingState } from 'common/components/LoadingState'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { tokenIds } from 'consts/tokenIds'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { LogoWithNetwork } from 'common/components/LogoWithNetwork'
import { ServiceProviderCategories } from 'features/meld/consts'
import { TokenType } from '@avalabs/vm-module-types'
import { selectActiveAccount } from 'store/account'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility } from 'store/portfolio'
import { isTokenVisible } from 'store/balance/utils'
import { LocalTokenWithBalance } from 'store/balance/types'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { useBuy } from '../hooks/useBuy'
import { useWithdraw } from '../hooks/useWithdraw'

interface SelectTokenProps {
  category: ServiceProviderCategories
  title: string
  isLoadingCryptoCurrencies: boolean
  onSelectOtherToken: () => void
  onSelectAvax: () => void
  onSelectUsdc: () => void
}

export const SelectToken = ({
  category,
  title,
  isLoadingCryptoCurrencies,
  onSelectOtherToken,
  onSelectAvax,
  onSelectUsdc
}: SelectTokenProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const cChainNetwork = useCChainNetwork()
  const activeAccount = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const tokensWithBalance = useTokensWithBalanceForAccount({
    account: activeAccount
  })
  const { isAvaxCBuyable, isUsdcBuyable } = useBuy()
  const { isAvaxCWithdrawable, isUsdcWithdrawable } = useWithdraw()

  // internalId only exists on balance-data tokens, so searching
  // tokensWithBalance is sufficient here; deliberately avoids
  // useSearchableTokenList, whose ~57k-token pipeline is what made this
  // screen stall on every entry and balance tick.
  const visibleTokens = useMemo(() => {
    const hideZeroBalance =
      category === ServiceProviderCategories.CRYPTO_OFFRAMP
    return tokensWithBalance.filter(
      (token: LocalTokenWithBalance) =>
        (!hideZeroBalance || token.balance > 0n) &&
        isTokenVisible(tokenVisibility, token) &&
        token.type !== TokenType.ERC1155 &&
        token.type !== TokenType.ERC721 &&
        enabledChainIds.includes(token.networkChainId)
    )
  }, [tokensWithBalance, tokenVisibility, enabledChainIds, category])

  const usdcAvalancheToken = visibleTokens.find(token => {
    return (
      'chainId' in token &&
      token.chainId &&
      isAvalancheChainId(token.chainId) &&
      token.internalId === tokenIds.USDC
    )
  })

  const avaxAvalancheToken = visibleTokens.find(
    token =>
      token.type === TokenType.NATIVE && token.symbol === TokenSymbol.AVAX
  )

  const data = useMemo(() => {
    const _data: GroupListItem[] = []

    if (
      (category === ServiceProviderCategories.CRYPTO_ONRAMP &&
        isAvaxCBuyable()) ||
      (category === ServiceProviderCategories.CRYPTO_OFFRAMP &&
        isAvaxCWithdrawable() &&
        (avaxAvalancheToken?.balance ?? 0) > 0)
    ) {
      _data.push({
        title: TokenSymbol.AVAX,
        leftIcon: <TokenLogo symbol={TokenSymbol.AVAX} />,
        onPress: onSelectAvax
      })
    }

    if (
      cChainNetwork &&
      usdcAvalancheToken &&
      ((category === ServiceProviderCategories.CRYPTO_ONRAMP &&
        isUsdcBuyable()) ||
        (category === ServiceProviderCategories.CRYPTO_OFFRAMP &&
          isUsdcWithdrawable() &&
          (usdcAvalancheToken?.balance ?? 0) > 0))
    ) {
      _data.push({
        title: TokenSymbol.USDC,
        leftIcon: (
          <LogoWithNetwork
            size="small"
            token={usdcAvalancheToken}
            network={cChainNetwork}
            outerBorderColor={colors.$surfaceSecondary}
          />
        ),
        onPress: onSelectUsdc
      })
    }
    _data.push({
      title: 'Select other token',
      onPress: onSelectOtherToken
    })

    return _data
  }, [
    onSelectAvax,
    cChainNetwork,
    usdcAvalancheToken,
    onSelectOtherToken,
    colors.$surfaceSecondary,
    onSelectUsdc,
    avaxAvalancheToken,
    category,
    isAvaxCBuyable,
    isAvaxCWithdrawable,
    isUsdcBuyable,
    isUsdcWithdrawable
  ])

  return (
    <ScrollScreen
      title={title}
      isModal
      disableHeaderSnap
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
      <Space y={16} />
      {isLoadingCryptoCurrencies ? (
        <LoadingState sx={{ flexGrow: 1 }} />
      ) : (
        <GroupList
          data={data}
          titleSx={{
            fontFamily: 'Inter-SemiBold',
            fontSize: 16,
            lineHeight: 22
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
