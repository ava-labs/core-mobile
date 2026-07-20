import { bigIntToString } from '@avalabs/core-utils-sdk'
import { useCallback, useEffect, useState } from 'react'
import Web3 from 'web3'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { MaxUint256 } from 'ethers'
import {
  TokenApproval,
  TokenApprovals,
  TokenType
} from '@avalabs/vm-module-types'
import { hexToBigInt, isHex } from 'viem'
import { safeBigInt } from 'common/utils/safeBigInt'

const toSpendLimit = (tokenApproval: TokenApproval): SpendLimit => {
  const token = tokenApproval.token
  if (token.type === TokenType.ERC20 && tokenApproval.value) {
    const bn = isHex(tokenApproval.value)
      ? hexToBigInt(tokenApproval.value)
      : safeBigInt(tokenApproval.value, 0n)
    if (bn >= BigInt(MaxUint256.toString())) {
      return { limitType: Limit.UNLIMITED, value: undefined, tokenApproval }
    }
    return {
      limitType: Limit.DEFAULT,
      value: { bn, amount: bigIntToString(bn, token.decimals) },
      tokenApproval
    }
  }
  return { limitType: Limit.DEFAULT, tokenApproval }
}

// Decode the uint256 amount out of a re-encoded ERC-20 `approve(spender,
// amount)` calldata (the shape updateSpendLimit produces). Returns undefined if
// the calldata isn't an approve call so callers fall back to the default.
const decodeApproveAmount = (calldata: string): bigint | undefined => {
  try {
    const decoded = new Web3().eth.abi.decodeParameters(
      ['address', 'uint256'],
      '0x' + calldata.slice(10) // drop `0x` + 4-byte method selector
    )
    return BigInt(decoded[1] as string)
  } catch {
    return undefined
  }
}

// Rebuild the editable approval's display SpendLimit from a previously-stored
// override's calldata. Used to seed a freshly-mounted step (e.g. a batch step
// re-visited after editing) so the amount shown matches the amount that will be
// signed, instead of snapping back to the pristine default.
const applyCustomSpendToDisplay = (
  defaults: SpendLimit[],
  calldata: string
): SpendLimit[] => {
  const base = defaults[0]
  if (
    !base ||
    base.tokenApproval.token.type !== TokenType.ERC20 ||
    !base.tokenApproval.value
  ) {
    return defaults
  }
  const amount = decodeApproveAmount(calldata)
  if (amount === undefined) return defaults

  const token = base.tokenApproval.token
  if (amount >= BigInt(MaxUint256.toString())) {
    return [{ ...base, limitType: Limit.UNLIMITED, value: undefined }]
  }
  const originalBn = isHex(base.tokenApproval.value)
    ? hexToBigInt(base.tokenApproval.value)
    : safeBigInt(base.tokenApproval.value, 0n)
  return [
    {
      ...base,
      // An override equal to the original is a DEFAULT selection; anything else
      // is a user-entered CUSTOM amount.
      limitType: amount === originalBn ? Limit.DEFAULT : Limit.CUSTOM,
      value: { bn: amount, amount: bigIntToString(amount, token.decimals) }
    }
  ]
}

export const useSpendLimits = (
  tokenApprovals: TokenApprovals | undefined,
  // A previously-stored override's `approve` calldata. When present, the hook
  // mounts already reflecting that edit — both the signed value
  // (`hashedCustomSpend`) and the on-screen amount — so a component that
  // remounts (e.g. a re-visited batch step) stays in sync with the override its
  // parent still holds. Single-tx callers omit it and behave as before.
  initialCustomSpend?: string
): {
  spendLimits: SpendLimit[]
  canEdit: boolean
  updateSpendLimit: (spendLimit: SpendLimit) => void
  hashedCustomSpend: string | undefined
} => {
  const [spendLimits, setSpendLimits] = useState<SpendLimit[]>([])

  const [hashedCustomSpend, setHashedCustomSpend] = useState<
    string | undefined
  >(initialCustomSpend)

  useEffect(() => {
    if (!tokenApprovals || tokenApprovals.approvals.length === 0) {
      return
    }

    const defaults = tokenApprovals.approvals.map(toSpendLimit)
    setSpendLimits(
      initialCustomSpend
        ? applyCustomSpendToDisplay(defaults, initialCustomSpend)
        : defaults
    )
    // `initialCustomSpend` only seeds the first render of a freshly-mounted
    // step; subsequent edits flow through updateSpendLimit. It's intentionally
    // excluded from deps so a parent re-render can't re-seed over a live edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenApprovals])

  const canEdit = tokenApprovals !== undefined && tokenApprovals.isEditable

  const updateSpendLimit = useCallback(
    (newSpendData: SpendLimit) => {
      const spendLimit = spendLimits[0]
      if (
        !canEdit ||
        !spendLimit ||
        !spendLimit.tokenApproval.value ||
        spendLimit.tokenApproval.token.type !== TokenType.ERC20
      ) {
        return
      }
      let limitAmount: string | undefined
      if (newSpendData.limitType === Limit.UNLIMITED) {
        setSpendLimits([
          {
            ...spendLimit,
            limitType: Limit.UNLIMITED,
            value: undefined
          }
        ])
        limitAmount = `0x${MaxUint256.toString(16)}`
      } else if (newSpendData.limitType === Limit.DEFAULT) {
        const bn = isHex(spendLimit.tokenApproval.value)
          ? hexToBigInt(spendLimit.tokenApproval.value)
          : safeBigInt(spendLimit.tokenApproval.value, 0n)
        setSpendLimits([
          {
            ...spendLimit,
            limitType: Limit.DEFAULT,
            value: {
              bn,
              amount: bigIntToString(
                bn,
                spendLimit.tokenApproval.token.decimals
              )
            }
          }
        ])
        limitAmount = bn.toString()
      } else {
        setSpendLimits([newSpendData])

        limitAmount = newSpendData?.value?.bn.toString()
      }

      const web3 = new Web3()

      const contract = new web3.eth.Contract(
        ERC20.abi as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        spendLimit?.tokenApproval.token.address
      )

      const hashed =
        limitAmount &&
        contract.methods
          .approve?.(spendLimit.tokenApproval.spenderAddress, limitAmount)
          .encodeABI()

      setHashedCustomSpend(hashed)
    },
    [spendLimits, canEdit]
  )

  return {
    spendLimits,
    canEdit,
    updateSpendLimit,
    hashedCustomSpend
  }
}

export enum Limit {
  DEFAULT = 'DEFAULT',
  UNLIMITED = 'UNLIMITED',
  CUSTOM = 'CUSTOM'
}

export interface SpendLimit {
  limitType: Limit
  value?: {
    bn: bigint
    amount: string
  }
  tokenApproval: TokenApproval
}
