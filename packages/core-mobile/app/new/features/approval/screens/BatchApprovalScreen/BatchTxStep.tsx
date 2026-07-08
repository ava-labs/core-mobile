import { getNetworkSymbol } from 'consts/chainIdsWithIncorrectSymbol'
import { useSpendLimits } from 'hooks/useSpendLimits'
import React, { useEffect, useMemo } from 'react'
import { View } from '@avalabs/k2-alpine'
import { SigningData_EthSendTx, SigningRequest } from '@avalabs/vm-module-types'
import BalanceChange from '../../components/BalanceChange/BalanceChange'
import { Details } from '../../components/Details'
import { SpendLimits } from '../../components/SpendLimits/SpendLimits'
import { getHasBalanceChange } from '../ApprovalScreen/utils'

// Renders a single transaction step within the batch approval stepper. This is
// split out from BatchApprovalScreen so `useSpendLimits` — which manages the
// per-tx editable spend limit — is called at a component top level rather than
// inside a loop over `signingRequests` (looping would violate
// react-hooks/rules-of-hooks).
export const BatchTxStep = ({
  index,
  signingRequest,
  chainId,
  disabled,
  initialOverride,
  onOverride
}: {
  index: number
  signingRequest: SigningRequest<SigningData_EthSendTx>
  // Numeric chainId resolved from the request's CAIP-2 id by the parent. The
  // per-step `displayData.network` is empty simulation metadata, so the L2
  // symbol correction must be sourced from the request, not from displayData.
  chainId?: number
  disabled?: boolean
  // The override calldata the parent already holds for this step, if any. This
  // step is remounted (keyed by index) on every navigation, so it must be
  // seeded with the existing override to keep its displayed amount consistent
  // with what will be signed when the user returns to an already-edited step.
  initialOverride?: string
  onOverride: (
    index: number,
    encodedApproveCalldata: string | undefined
  ) => void
}): JSX.Element => {
  const { displayData } = signingRequest

  const symbol = getNetworkSymbol(chainId)

  const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
    useSpendLimits(displayData.tokenApprovals, initialOverride)

  useEffect(() => {
    if (hashedCustomSpend === undefined) return
    onOverride(index, hashedCustomSpend)
  }, [hashedCustomSpend, index, onOverride])

  // Drop the one-time recurring schedule fee from the expanded token list. On
  // the wrap step the native (AVAX) outflow bundles two items: the wrap
  // principal — which has a matching inflow of the wrapped token (WAVAX) at the
  // same amount — and the schedule fee, which has no matching inflow. Keep the
  // converted principal, drop the unmatched fee. Contract tokens carry an
  // `address`; the native token doesn't. If nothing matches (not a wrap), the
  // diff is left untouched rather than guessing.
  const balanceChange = useMemo(() => {
    const bc = displayData.balanceChange
    if (!bc) return undefined

    const isNative = (token: object): boolean => !('address' in token)
    const inflowValues = new Set(
      bc.ins.flatMap(diff => diff.items.map(item => item.displayValue))
    )

    const outs = bc.outs
      .map(diff => {
        if (!isNative(diff.token) || diff.items.length <= 1) return diff
        const converted = diff.items.filter(item =>
          inflowValues.has(item.displayValue)
        )
        return converted.length > 0 ? { ...diff, items: converted } : diff
      })
      .filter(diff => diff.items.length > 0)

    return { ...bc, outs }
  }, [displayData.balanceChange])

  const hasBalanceChange = getHasBalanceChange(balanceChange)

  // Drop the "Website" row from every step's details — it's dApp-origin noise
  // that doesn't belong on the batch review.
  const detailSections = useMemo(
    () =>
      displayData.details.map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            typeof item === 'string' ||
            !('label' in item) ||
            item.label.toLowerCase() !== 'website'
        )
      })),
    [displayData.details]
  )

  // Spacing note: `Details` has no built-in margin, so the 12px gap above the
  // details card is driven by the card above it — `BalanceChange` carries a
  // built-in 12px `marginBottom`, and the spend-limit block gets a matching 12px
  // `marginBottom` wrapper. This keeps every adjacent pair a uniform 12px without
  // double-spacing (a container `gap` plus per-card margins would give 24px).
  return (
    <View>
      {/* Token-movement steps (the AVAX → WAVAX wrap, the WAVAX → USDC swap)
          show the balance-change conversion. Their editable spend-limit block
          (the big amount card + spend limit + spender rows) is intentionally
          hidden here — it only belongs on a pure ERC-20 approval step, which
          has no balance change. */}
      {hasBalanceChange && balanceChange ? (
        <BalanceChange balanceChange={balanceChange} />
      ) : (
        spendLimits.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <SpendLimits
              spendLimits={spendLimits}
              onSelect={canEdit && !disabled ? updateSpendLimit : undefined}
            />
          </View>
        )
      )}
      {detailSections.map((detailSection, sectionIndex) => (
        <Details
          key={sectionIndex}
          detailSection={detailSection}
          symbol={symbol}
        />
      ))}
    </View>
  )
}
