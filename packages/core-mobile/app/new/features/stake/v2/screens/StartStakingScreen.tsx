import { Icons, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useStartStaking } from 'features/stake/v2/hooks/useStartStaking'
import useStakingParams from 'hooks/earn/useStakingParams'
import React, { useMemo } from 'react'
import EasiestRibbonIcon from '../../../../assets/icons/easiest_ribbon.svg'
import { Bullet, StakingMethodCard } from '../components/StakingMethodCard'

// "EASIEST" ribbon shown on the Fast Stake card. Lives at the chooser
// level (not inside the card component) so the card stays agnostic of
// any specific ribbon asset; future ribbons can be added here without
// touching `StakingMethodCard`.
const EASIEST_RIBBON = { label: 'EASIEST', Icon: EasiestRibbonIcon }

/**
 * Entry screen for the V2 add-stake flow. Lets the user pick how they
 * want to start staking — Fast stake (recommended, opinionated path)
 * or Delegate (manual validator selection). The Validate option from
 * the design is intentionally omitted for now.
 *
 * Fast stake hands off to `/addStakeV2/fastStake/amount`. Delegate
 * currently surfaces a "Coming soon" alert via `useStartStaking`; when
 * the advanced delegate flow lands it'll route to
 * `/addStakeV2/delegate/...` instead.
 */
const StartStakingScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { annualPercentageYieldBPS, minStakeAmount } = useStakingParams()
  const { hasEnoughAvax, canAddStake, startFastStake, startDelegate } =
    useStartStaking()

  const apyText = useMemo(
    () => `${(annualPercentageYieldBPS / 100).toFixed(1)}% APY`,
    [annualPercentageYieldBPS]
  )

  const minStakeText = useMemo(
    () => `Minimum stake: ${minStakeAmount.toDisplay()} AVAX`,
    [minStakeAmount]
  )

  // Mirror the design's Validate row: the minimum-stake requirement shows
  // a red exclamation when the user can't cover it. `hasEnoughAvax` is
  // only `false` once the balance has loaded and falls short, so an
  // undefined (still loading) value keeps the satisfied check.
  const minStakeBullet = useMemo<Bullet>(
    () => ({ label: minStakeText, satisfied: hasEnoughAvax !== false }),
    [minStakeText, hasEnoughAvax]
  )

  return (
    <ScrollScreen
      title={'Choose a way to\nstart staking'}
      navigationTitle="Choose a way to start staking"
      isModal
      contentContainerStyle={{
        padding: 16,
        gap: 8
      }}>
      {/* Both cards are subdued while the balance is still loading so a
          press can't surface a misleading "not enough AVAX" alert (the
          balance query returns `undefined` until it resolves either way).
          Once `canAddStake` flips true, both flows' presses behave
          normally. */}
      <StakingMethodCard
        icon={<Icons.Custom.Bolt color={theme.colors.$textPrimary} />}
        title="Fast stake"
        subtitle="Recommended for most users"
        bullets={[
          { label: apyText },
          { label: 'Start earning in seconds' },
          { label: 'One-tap restakes' },
          minStakeBullet
        ]}
        ribbon={EASIEST_RIBBON}
        onPress={startFastStake}
        disabled={!canAddStake}
      />
      <StakingMethodCard
        icon={<Icons.Custom.DatabaseSearch color={theme.colors.$textPrimary} />}
        title="Delegate"
        subtitle="Choose a node for delegation"
        bullets={[{ label: 'Choose your own validator' }, minStakeBullet]}
        onPress={startDelegate}
        disabled={!canAddStake}
      />
    </ScrollScreen>
  )
}

export default StartStakingScreen
