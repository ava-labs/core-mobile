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
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import NetworkService from 'services/network/NetworkService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import useStakingParams from 'hooks/earn/useStakingParams'

export const Banner = (): JSX.Element | undefined => {
  const { theme } = useTheme()
  const { data } = useStakes()
  const { minStakeAmount } = useStakingParams()
  const isEmpty = !data || data.length === 0

  const pChainBalance = usePChainBalance()
  const cChainBalance = useCChainBalance()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const cChainNetwork = useCChainNetwork()
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDeveloperMode)

  const availableInAvax = useMemo(() => {
    return cChainBalance.data?.balance !== undefined && cChainNetwork
      ? new TokenUnit(
          cChainBalance.data.balance,
          cChainNetwork.networkToken.decimals,
          cChainNetwork.networkToken.symbol
        )
      : undefined
  }, [cChainBalance.data?.balance, cChainNetwork])

  const stakedInAvax = useMemo(() => {
    const unlockedStakedInNAvax =
      pChainBalance.data?.balancePerType.unlockedStaked
    return unlockedStakedInNAvax !== undefined
      ? new TokenUnit(
          unlockedStakedInNAvax,
          pChainNetworkToken.decimals,
          pChainNetworkToken.symbol
        )
      : undefined
  }, [
    pChainBalance.data?.balancePerType.unlockedStaked,
    pChainNetworkToken.decimals,
    pChainNetworkToken.symbol
  ])

  const pendingStakedInAvax = useMemo(() => {
    const pendingStakedInNAvax =
      pChainBalance.data?.balancePerType.pendingStaked
    return pendingStakedInNAvax !== undefined
      ? new TokenUnit(
          pendingStakedInNAvax,
          pChainNetworkToken.decimals,
          pChainNetworkToken.symbol
        )
      : undefined
  }, [
    pChainBalance.data?.balancePerType.pendingStaked,
    pChainNetworkToken.decimals,
    pChainNetworkToken.symbol
  ])

  const totalStakedInAvax = useMemo(() => {
    if (pendingStakedInAvax === undefined) {
      return stakedInAvax
    }

    if (stakedInAvax === undefined) {
      return pendingStakedInAvax
    }

    return stakedInAvax.add(pendingStakedInAvax)
  }, [stakedInAvax, pendingStakedInAvax])

  const formattedTotalStaked = totalStakedInAvax?.toDisplay({ fixedDp: 2 })
  const formattedTotalAvailable = useMemo(
    () =>
      totalStakedInAvax?.add(availableInAvax ?? 0)?.toDisplay({ fixedDp: 2 }),
    [availableInAvax, totalStakedInAvax]
  )

  const percentage = useMemo(() => {
    if (totalStakedInAvax === undefined || availableInAvax === undefined) {
      return 0
    }

    const totalAvailable = totalStakedInAvax.add(availableInAvax)
    return totalStakedInAvax
      .div(totalAvailable)
      .toDisplay({ fixedDp: 2, asNumber: true })
  }, [totalStakedInAvax, availableInAvax])

  if (isEmpty) {
    return (
      <View
        sx={{
          paddingHorizontal: 16,
          paddingBottom: 4
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
        paddingHorizontal: 16,
        paddingBottom: 4
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
