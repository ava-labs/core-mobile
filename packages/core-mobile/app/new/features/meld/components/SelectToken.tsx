import { GroupList, GroupListItem, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useMemo } from 'react'
import { TokenLogo } from 'common/components/TokenLogo'
import { Space } from 'common/components/Space'
import { TokenSymbol } from 'store/network'
import { LoadingState } from 'common/components/LoadingState'
import { useAvalancheErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { USDC_AVALANCHE_C_TOKEN_ID } from 'common/consts/swap'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { LogoWithNetwork } from 'common/components/LogoWithNetwork'
import { ServiceProviderCategories } from 'features/meld/consts'
import { TokenType } from '@avalabs/vm-module-types'
import { useResetMeldTokenList } from '../hooks/useResetMeldTokenList'

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
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: avalancheErc20ContractTokens,
    hideZeroBalance: category === ServiceProviderCategories.CRYPTO_OFFRAMP
  })

  useResetMeldTokenList()

  const usdcAvalancheToken = filteredTokenList.find(
    token =>
      'chainId' in token &&
      token.chainId &&
      isAvalancheChainId(token.chainId) &&
      token.address.toLowerCase() === USDC_AVALANCHE_C_TOKEN_ID.toLowerCase()
  )

  const avaxAvalancheToken = filteredTokenList.find(
    token =>
      token.type === TokenType.NATIVE && token.symbol === TokenSymbol.AVAX
  )

  const data = useMemo(() => {
    const _data: GroupListItem[] = []

    if (
      category === ServiceProviderCategories.CRYPTO_ONRAMP ||
      (category === ServiceProviderCategories.CRYPTO_OFFRAMP &&
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
      (category === ServiceProviderCategories.CRYPTO_ONRAMP ||
        (category === ServiceProviderCategories.CRYPTO_OFFRAMP &&
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
    category
  ])

  return (
    <ScrollScreen
      title={title}
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
