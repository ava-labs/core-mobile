import { bnToLocaleString, hexToBN } from '@avalabs/core-utils-sdk'
import { useCallback, useEffect, useState } from 'react'
import Web3 from 'web3'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { MaxUint256 } from 'ethers'
import {
  TokenApproval,
  TokenType,
  TokenApprovals
} from '@avalabs/vm-module-types'
import type BN from 'bn.js'

export const useSpendLimits = (
  tokenApprovals: TokenApprovals | undefined
): {
  spendLimits: SpendLimit[]
  canEdit: boolean
  updateSpendLimit: (spendLimit: SpendLimit) => void
  hashedCustomSpend: string | undefined
} => {
  const [spendLimits, setSpendLimits] = useState<SpendLimit[]>([])

  const [hashedCustomSpend, setHashedCustomSpend] = useState<string>()

  useEffect(() => {
    if (!tokenApprovals || tokenApprovals.approvals.length === 0) {
      return
    }

    const _spendLimits: SpendLimit[] = []

    for (const tokenApproval of tokenApprovals.approvals) {
      const token = tokenApproval.token
      if (token.type === TokenType.ERC20 && tokenApproval.value) {
        const defaultLimitBN = hexToBN(tokenApproval.value)
        _spendLimits.push({
          limitType: Limit.DEFAULT,
          value: {
            bn: defaultLimitBN,
            amount: bnToLocaleString(defaultLimitBN, token.decimals)
          },
          tokenApproval
        })
      } else {
        _spendLimits.push({
          limitType: Limit.DEFAULT,
          tokenApproval
        })
      }
    }

    setSpendLimits(_spendLimits)
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
        const bn = hexToBN(spendLimit.tokenApproval.value)
        setSpendLimits([
          {
            ...spendLimit,
            limitType: Limit.DEFAULT,
            value: {
              bn,
              amount: bnToLocaleString(
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
          .approve(spendLimit.tokenApproval.spenderAddress, limitAmount)
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
    bn: BN
    amount: string
  }
  tokenApproval: TokenApproval
}
