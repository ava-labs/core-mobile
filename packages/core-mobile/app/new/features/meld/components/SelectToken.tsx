import { GroupList, GroupListItem, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenLogo } from 'common/components/TokenLogo'
import { Space } from 'common/components/Space'
import { TokenSymbol } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { LoadingState } from 'common/components/LoadingState'
import { useTokenLookup } from 'common/hooks/useTokenLookup'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { tokenIds } from 'consts/tokenIds'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { LogoWithNetwork } from 'common/components/LogoWithNetwork'
import { ServiceProviderCategories } from 'features/meld/consts'
import { TokenType } from '@avalabs/vm-module-types'
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
  const cChainTokensWithBalance = useTokensWithBalanceForAccount({
    account: activeAccount,
    chainId: cChainNetwork?.chainId
  })
  const { isAvaxCBuyable, isUsdcBuyable } = useBuy()
  const { isAvaxCWithdrawable, isUsdcWithdrawable } = useWithdraw()

  // tokenIds.USDC is a cross-chain internalId (same id for USDC on every
  // chain), and the balance hook silently falls back to ALL networks when
  // cChainNetwork is transiently undefined -- guard on chain explicitly so
  // that can't match a token from another chain.
  const heldUsdcAvalancheToken = useMemo(
    () =>
      cChainTokensWithBalance.find(
        token =>
          token.internalId === tokenIds.USDC &&
          token.networkChainId === cChainNetwork?.chainId
      ),
    [cChainTokensWithBalance, cChainNetwork]
  )

  // Native AVAX metadata isn't rendered (icon below is static), so only its
  // balance matters -- no aggregator lookup needed when it's unheld.
  const avaxAvalancheToken = useMemo(
    () =>
      cChainTokensWithBalance.find(
        token =>
          token.type === TokenType.NATIVE &&
          token.symbol === TokenSymbol.AVAX &&
          token.networkChainId === cChainNetwork?.chainId
      ),
    [cChainTokensWithBalance, cChainNetwork]
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
