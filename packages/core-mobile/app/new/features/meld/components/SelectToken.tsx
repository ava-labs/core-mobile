import { GroupList, GroupListItem, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenLogo } from 'common/components/TokenLogo'
import { Space } from 'common/components/Space'
import { TokenSymbol } from 'store/network'
import { LoadingState } from 'common/components/LoadingState'
import { useTokenLookup } from 'common/hooks/useTokenLookup'
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

  // tokenIds.USDC is a cross-chain internalId (the same id for USDC on every
  // chain), so match on the active C-Chain explicitly or a USDC balance from
  // another chain can satisfy this find.
  const heldUsdcAvalancheToken = useMemo(
    () =>
      visibleTokens.find(
        token =>
          token.internalId === tokenIds.USDC &&
          token.networkChainId === cChainNetwork?.chainId
      ),
    [visibleTokens, cChainNetwork]
  )

  // AVAX is the native token of X- and P-Chain as well, so this is pinned to
  // the active C-Chain rather than matching on symbol alone.
  const avaxAvalancheToken = useMemo(
    () =>
      visibleTokens.find(
        token =>
          token.type === TokenType.NATIVE &&
          token.symbol === TokenSymbol.AVAX &&
          token.networkChainId === cChainNetwork?.chainId
      ),
    [visibleTokens, cChainNetwork]
  )

  // Unlike AVAX, USDC-C's icon is rendered, so an unheld account still needs
  // its symbol/logo -- fetch only this one token, not the full contract list.
  const usdcLookupIds = useMemo(
    () => (heldUsdcAvalancheToken ? [] : [{ internalId: tokenIds.USDC }]),
    [heldUsdcAvalancheToken]
  )
  const { data: usdcLookupTokens } = useTokenLookup(usdcLookupIds)

  const usdcAvalancheToken = useMemo(():
    | { symbol: string; logoUri?: string; chainId?: number; balance: bigint }
    | undefined => {
    if (heldUsdcAvalancheToken) {
      return {
        symbol: heldUsdcAvalancheToken.symbol,
        logoUri: heldUsdcAvalancheToken.logoUri,
        chainId: heldUsdcAvalancheToken.networkChainId,
        balance: heldUsdcAvalancheToken.balance
      }
    }
    const info = usdcLookupTokens[tokenIds.USDC.toLowerCase()]
    if (!info || !cChainNetwork) {
      return undefined
    }
    return {
      symbol: info.symbol,
      logoUri: info.meta?.logoUri ?? undefined,
      chainId: cChainNetwork.chainId,
      balance: 0n
    }
  }, [heldUsdcAvalancheToken, usdcLookupTokens, cChainNetwork])

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
