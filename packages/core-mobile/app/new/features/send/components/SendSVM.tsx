import React, { useEffect, useState } from 'react'
import useSVMSend from 'common/hooks/send/useSVMSend'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenType, TokenWithBalanceSVM } from '@avalabs/vm-module-types'
import { Account } from 'store/account'
import { Address, address as toAddress } from '@solana/kit'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import ModuleManager from 'vmModule/ModuleManager'
import { SolanaProvider } from '@avalabs/core-wallets-sdk'
import { useSendContext } from '../context/sendContext'
import { useSendSelectedToken } from '../store'
import { SendToken } from './SendToken'

// Network-aware caches keyed by RPC URL (or chainId fallback) to handle different clusters
// Note: "account doesn't exist" (exists=false) is cached for the session. If the recipient
// account gets created later in the same session, the cache will still report it as missing
// until cleared. This is acceptable for send UX but may cause brief UX staleness.
const RENT_EXEMPT_CACHE = new Map<string, bigint>()
const ACCOUNT_EXISTS_CACHE = new Map<
  string,
  { exists: boolean; space: bigint }
>()

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
    let cancelled = false

    const fetchMinimumSendAmount = async (): Promise<void> => {
      try {
        // Clear minimum when not applicable
        if (selectedToken?.type !== TokenType.NATIVE) {
          setMinimumSendAmount(undefined)
          return
        }

        if (!recipient?.addressSVM) {
          setMinimumSendAmount(undefined)
          return
        }

        const minimum = await calculateMinimumForNewAccount(
          recipient.addressSVM,
          network
        )

        if (!cancelled) {
          setMinimumSendAmount(
            minimum
              ? new TokenUnit(minimum, nativeToken.decimals, nativeToken.symbol)
              : undefined
          )
        }
      } catch (error) {
        // Clear minimum on error to prevent stuck state
        if (!cancelled) {
          setMinimumSendAmount(undefined)
        }
      }
    }

    fetchMinimumSendAmount()

    return () => {
      cancelled = true
    }
  }, [network, recipient?.addressSVM, nativeToken, selectedToken?.type])

  return <SendToken onSend={handleSend} minimumSendAmount={minimumSendAmount} />
}

const calculateMinimumForNewAccount = async (
  recipientAddress: string,
  network: Network
): Promise<bigint | undefined> => {
  const provider = await ModuleManager.solanaModule.getProvider(
    mapToVmNetwork(network)
  )

  // Use rpcUrl if available, otherwise fallback to chainId for cache key
  const rpcKey =
    network.rpcUrl || network.rpcUrl.length > 0
      ? network.rpcUrl
      : `chain:${network.chainId}`

  const accountInfo = await checkAccountExists(
    toAddress(recipientAddress),
    provider,
    rpcKey
  )

  // Return undefined if account already exists (even with 0 space)
  if (accountInfo.exists) {
    return undefined
  }

  // Account doesn't exist - calculate rent-exempt minimum for 0 space (basic SOL account)
  return getRentExemptMinimum(0n, provider, rpcKey)
}

const checkAccountExists = async (
  address: Address,
  provider: SolanaProvider,
  rpcUrl: string
): Promise<{ exists: boolean; space: bigint }> => {
  const cacheKey = `${rpcUrl}:${address}`
  const cached = ACCOUNT_EXISTS_CACHE.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  try {
    const accountInfo = await provider.getAccountInfo(address).send()
    // Account exists if value is not null (even if space is 0)
    const exists = accountInfo.value !== null
    const space = accountInfo.value?.space ?? 0n
    const result = { exists, space }
    ACCOUNT_EXISTS_CACHE.set(cacheKey, result)

    return result
  } catch (e) {
    throw new Error(
      `Failed to fetch account info for ${address.toString()}: ${e}`
    )
  }
}

const getRentExemptMinimum = async (
  space: bigint,
  provider: SolanaProvider,
  rpcUrl: string
): Promise<bigint> => {
  const cacheKey = `${rpcUrl}:${space}`
  const cached = RENT_EXEMPT_CACHE.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  try {
    const rentExemptMinimum = await provider
      .getMinimumBalanceForRentExemption(space)
      .send()

    RENT_EXEMPT_CACHE.set(cacheKey, rentExemptMinimum)

    return rentExemptMinimum
  } catch (e) {
    throw new Error(
      `Failed to fetch rent-exempt minimum for space ${space}: ${e}`
    )
  }
}
