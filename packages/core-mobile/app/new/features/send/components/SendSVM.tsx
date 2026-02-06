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

// Network-aware caches keyed by RPC URL to handle different clusters
const RENT_EXEMPT_CACHE = new Map<string, bigint>()
const ACCOUNT_SPACE_CACHE = new Map<string, bigint>()

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

  const accountSpace = await getAccountOccupiedSpace(
    toAddress(recipientAddress),
    provider,
    network.rpcUrl
  )

  // Return undefined if account already exists
  if (accountSpace !== 0n) {
    return undefined
  }

  return getRentExemptMinimum(accountSpace, provider, network.rpcUrl)
}

const getAccountOccupiedSpace = async (
  address: Address,
  provider: SolanaProvider,
  rpcUrl: string
): Promise<bigint> => {
  const cacheKey = `${rpcUrl}:${address}`
  const cached = ACCOUNT_SPACE_CACHE.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  try {
    const accountInfo = await provider.getAccountInfo(address).send()
    const space = accountInfo.value?.space ?? 0n
    ACCOUNT_SPACE_CACHE.set(cacheKey, space)

    return space
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
