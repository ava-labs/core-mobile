import { bnToLocaleString, hexToBN } from '@avalabs/utils-sdk'
import { useCallback, useEffect, useState } from 'react'
import Web3 from 'web3'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { MaxUint256 } from 'ethers'
import { AssetExposure, TokenType } from '@avalabs/vm-module-types'
import BN from 'bn.js'

export const useSpendLimits = (
  exposures: AssetExposure[]
): {
  spendLimits: SpendLimit[]
  canEdit: boolean
  updateSpendLimit: (spendLimit: SpendLimit) => void
  hashedCustomSpend: string | undefined
} => {
  const [spendLimits, setSpendLimits] = useState<SpendLimit[]>([])

  const [hashedCustomSpend, setHashedCustomSpend] = useState<string>()

  useEffect(() => {
    if (exposures.length === 0) {
      return
    }

    const _spendLimits: SpendLimit[] = []

    for (const exposure of exposures) {
      const token = exposure.token
      if (token.contractType === TokenType.ERC20 && exposure.value) {
        const defaultLimitBN = hexToBN(exposure.value)
        _spendLimits.push({
          limitType: Limit.DEFAULT,
          value: {
            bn: defaultLimitBN,
            amount: bnToLocaleString(defaultLimitBN, token.decimals)
          },
          exposure
        })
      } else {
        _spendLimits.push({
          limitType: Limit.DEFAULT,
          exposure
        })
      }
    }

    setSpendLimits(_spendLimits)
  }, [exposures])

  const canEdit =
    spendLimits.length === 1 &&
    spendLimits[0]?.exposure.token.contractType === TokenType.ERC20

  const updateSpendLimit = useCallback(
    (newSpendData: SpendLimit) => {
      const spendLimit = spendLimits[0]
      if (!canEdit || !spendLimit || !spendLimit.exposure.value) {
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
        const bn = hexToBN(spendLimit.exposure.value)
        setSpendLimits([
          {
            ...spendLimit,
            limitType: Limit.DEFAULT,
            value: {
              bn,
              amount: bnToLocaleString(bn, spendLimit.exposure.token.decimals)
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
        spendLimit?.exposure.token.address
      )

      const hashed =
        limitAmount &&
        contract.methods
          .approve(spendLimit.exposure.spenderAddress, limitAmount)
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
  exposure: AssetExposure
}
