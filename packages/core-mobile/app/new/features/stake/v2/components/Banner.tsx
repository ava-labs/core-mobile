import React, { useMemo } from 'react'
import {
  Text,
  Card,
  Icons,
  CircularProgress,
  Separator,
  SxProp,
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
import { isOnGoing } from 'utils/earn/status'
import { getEarnedRewardAmount, getEstimatedRewardAmount } from '../../utils'

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

  // Pending rewards = sum of estimated rewards across currently-active stakes.
  // We can't use the P-chain "unlocked unstaked" balance because that includes
  // returned principal, not just reward.
  const pendingRewards = useMemo(() => {
    const zero = new TokenUnit(
      0n,
      pChainNetworkToken.decimals,
      pChainNetworkToken.symbol
    )
    if (!data) return zero
    const now = new Date()
    return data.reduce((acc, stake) => {
      if (!isOnGoing(stake, now)) return acc
      const reward = getEstimatedRewardAmount(stake, pChainNetworkToken)
      return reward ? acc.add(reward) : acc
    }, zero)
  }, [data, pChainNetworkToken])

  // No dedicated API for total lifetime rewards yet — sum reward UTXOs across
  // the user's stakes. `getEarnedRewardAmount` returns undefined for stakes
  // that haven't paid out yet (active / rejected), so they're skipped here.
  const totalLifetimeRewards = useMemo(() => {
    const zero = new TokenUnit(
      0n,
      pChainNetworkToken.decimals,
      pChainNetworkToken.symbol
    )
    if (!data) return zero
    return data.reduce((acc, stake) => {
      const reward = getEarnedRewardAmount(stake, pChainNetworkToken)
      return reward ? acc.add(reward) : acc
    }, zero)
  }, [data, pChainNetworkToken])

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
    if (stakedInAvax === undefined || availableInAvax === undefined) {
      return 0
    }

    const totalAvailable = stakedInAvax.add(availableInAvax)
    // Guard against division by zero only when nothing is staked AND nothing is
    // free — e.g. "all funds staked" (availableInAvax = 0, stakedInAvax > 0)
    // should render as 100%, not 0%.
    if (totalAvailable.isZero()) {
      return 0
    }
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
          paddingVertical: 14,
          paddingHorizontal: 18,
          paddingRight: 20,
          // Card defaults to alignItems: 'center' which collapses the Separator
          // (it has no intrinsic width). Stretch children so the divider spans
          // the full card width.
          alignItems: 'stretch'
        }}>
        <View sx={{ flexDirection: 'row' }}>
          <RewardColumn
            amount={pendingRewards.toDisplay()}
            label="Pending rewards"
            sx={{ flex: 0.4 }}
          />
          <RewardColumn
            amount={totalLifetimeRewards.toDisplay()}
            label="Total lifetime rewards"
            sx={{ flex: 0.6 }}
          />
        </View>

        <Separator sx={{ marginVertical: 12 }} />

        <View sx={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
          <CircularProgress progress={percentage} />
          <Text variant="body2" sx={{ flexShrink: 1 }}>
            {formattedTotalStaked} AVAX are currently staked out of{' '}
            {formattedTotalAvailable} AVAX available
          </Text>
        </View>
      </Card>
    </View>
  )
}

const RewardColumn = ({
  amount,
  label,
  sx
}: {
  amount: string
  label: string
  sx?: SxProp
}): JSX.Element => {
  return (
    <View sx={sx}>
      <Text
        sx={{
          fontFamily: 'Inter-SemiBold',
          fontSize: 21,
          lineHeight: 24,
          letterSpacing: -0.5,
          color: '$textPrimary'
        }}>
        {amount}
        <Text
          sx={{
            fontFamily: 'Inter-Medium',
            fontSize: 14,
            lineHeight: 24,
            color: '$textPrimary'
          }}>
          {' AVAX'}
        </Text>
      </Text>
      <Text
        variant="caption"
        sx={{
          fontFamily: 'Inter-Medium',
          color: '$textSecondary'
        }}>
        {label}
      </Text>
    </View>
  )
}
