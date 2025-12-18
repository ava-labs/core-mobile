import React, { useMemo } from 'react'
import {
  Text,
  Card,
  Icons,
  CircularProgress,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useStakes } from 'hooks/earn/useStakes'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import useStakingParams from 'hooks/earn/useStakingParams'

export const Banner = (): JSX.Element | undefined => {
  const { theme } = useTheme()
  const { data } = useStakes()
  const { minStakeAmount } = useStakingParams()
  const isEmpty = !data || data.length === 0

  const pChainBalance = usePChainBalance()
  const availableInAvax = useCChainBalance()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDeveloperMode)

  const stakedInAvax = useMemo(() => {
    const unlockedStakedInNAvax = pChainBalance?.balancePerType.unlockedStaked
    return unlockedStakedInNAvax !== undefined
      ? new TokenUnit(
          unlockedStakedInNAvax,
          pChainNetworkToken.decimals,
          pChainNetworkToken.symbol
        )
      : undefined
  }, [
    pChainBalance?.balancePerType.unlockedStaked,
    pChainNetworkToken.decimals,
    pChainNetworkToken.symbol
  ])

  const formattedTotalStaked = stakedInAvax?.toDisplay({ fixedDp: 2 })
  const formattedTotalAvailable = useMemo(
    () => stakedInAvax?.add(availableInAvax ?? 0)?.toDisplay({ fixedDp: 2 }),
    [availableInAvax, stakedInAvax]
  )

  const percentage = useMemo(() => {
    if (
      stakedInAvax === undefined ||
      availableInAvax === undefined ||
      stakedInAvax.isZero() ||
      availableInAvax.isZero()
    ) {
      return 0
    }

    const totalAvailable = stakedInAvax.add(availableInAvax)
    return stakedInAvax
      .div(totalAvailable)
      .toDisplay({ fixedDp: 2, asNumber: true })
  }, [stakedInAvax, availableInAvax])

  if (isEmpty) {
    return (
      <View
        sx={{
          paddingHorizontal: 16
        }}>
        <Card
          sx={{
            paddingVertical: 12,
            paddingHorizontal: 20,
            flexDirection: 'row',
            gap: 18,
            alignItems: 'center'
          }}>
          <Icons.Action.Info color={theme.colors.$textPrimary} />
          <Text variant="body2" sx={{ flexShrink: 1 }}>
            A minimum of {minStakeAmount.toDisplay()} AVAX is required to be
            able to stake on the Avalanche Network
          </Text>
        </Card>
      </View>
    )
  }

  if (!formattedTotalStaked || !formattedTotalAvailable) {
    return undefined
  }

  return (
    <View
      sx={{
        paddingHorizontal: 16
      }}>
      <Card
        sx={{
          paddingVertical: 12,
          paddingHorizontal: 18,
          paddingRight: 20,
          flexDirection: 'row',
          gap: 15,
          alignItems: 'center'
        }}>
        <CircularProgress progress={percentage} />
        <Text variant="body2" sx={{ flexShrink: 1 }}>
          {formattedTotalStaked} AVAX are currently staked out of{' '}
          {formattedTotalAvailable} AVAX available
        </Text>
      </Card>
    </View>
  )
}
