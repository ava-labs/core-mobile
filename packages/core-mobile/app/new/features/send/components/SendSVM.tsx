import React, { useEffect, useState } from 'react'
import useSVMSend from 'common/hooks/send/useSVMSend'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenType, TokenWithBalanceSVM } from '@avalabs/vm-module-types'
import { Account } from 'store/account'
import { Address, createSolanaRpc, address as toAddress } from '@solana/kit'
import NetworkService from 'services/network/NetworkService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSendContext } from '../context/sendContext'
import { useSendSelectedToken } from '../store'
import { SendToken } from './SendToken'

const RENT_EXEMPT_CACHE = new Map<bigint, bigint>()
const ACCOUNT_SPACE_CACHE = new Map<Address, bigint>()

export const SendSVM = ({
  nativeToken,
  network,
  account,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalanceSVM
  network: Network
  account: Account
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { maxFee, recipient } = useSendContext()
  const [selectedToken] = useSendSelectedToken()
  const [minimumSendAmount, setMinimumSendAmount] = useState<TokenUnit>()

  const { send } = useSVMSend({
    fromAddress: account.addressSVM,
    network,
    maxFee,
    nativeToken,
    account
  })

  const handleSend = async (): Promise<void> => {
    if (selectedToken === undefined) {
      return
    }

    try {
      const txHash = await send()
      onSuccess(txHash)
    } catch (error) {
      onFailure(error)
    }
  }

  useEffect(() => {
    const fetchMinimumSendAmount = async (): Promise<void> => {
      if (selectedToken?.type !== TokenType.NATIVE) {
        return
      }

      const provider = NetworkService.getSolanaProvider(network)

      if (!recipient?.addressSVM) {
        return
      }

      const accountSpace = await getAccountOccupiedSpace(
        toAddress(recipient.addressSVM),
        provider
      )

      if (accountSpace !== 0n) return

      const minimum = await getRentExemptMinimum(0n, provider)
      setMinimumSendAmount(
        new TokenUnit(minimum, nativeToken.decimals, nativeToken.symbol)
      )
    }
    fetchMinimumSendAmount()
  }, [network, recipient?.addressSVM, nativeToken, selectedToken?.type])

  return <SendToken onSend={handleSend} minimumSendAmount={minimumSendAmount} />
}

const getAccountOccupiedSpace = async (
  address: Address,
  provider: ReturnType<typeof createSolanaRpc>
): Promise<bigint> => {
  if (ACCOUNT_SPACE_CACHE.has(address)) {
    const cachedSpace = ACCOUNT_SPACE_CACHE.get(address)
    if (cachedSpace !== undefined) {
      return cachedSpace
    }
  }

  try {
    const accountInfo = await provider.getAccountInfo(address).send()
    const space = accountInfo.value?.space ?? 0n
    ACCOUNT_SPACE_CACHE.set(address, space)

    return space
  } catch (e) {
    throw new Error(
      `Failed to fetch account info for ${address.toString()}: ${e}`
    )
  }
}

const getRentExemptMinimum = async (
  space: bigint,
  provider: ReturnType<typeof createSolanaRpc>
): Promise<bigint> => {
  if (RENT_EXEMPT_CACHE.has(space)) {
    const cachedRentExempt = RENT_EXEMPT_CACHE.get(space)
    if (cachedRentExempt !== undefined) {
      return cachedRentExempt
    }
  }

  try {
    const rentExemptMinimum = await provider
      .getMinimumBalanceForRentExemption(0n)
      .send()

    RENT_EXEMPT_CACHE.set(0n, rentExemptMinimum)

    return rentExemptMinimum
  } catch (e) {
    throw new Error(
      `Failed to fetch rent-exempt minimum for space ${space}: ${e}`
    )
  }
}
