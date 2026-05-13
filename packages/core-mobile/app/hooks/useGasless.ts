import { useCallback, useEffect, useMemo, useState } from 'react'
import { SigningData } from '@avalabs/vm-module-types'
import { useSelector } from 'react-redux'
import {
  selectIsGaslessBlocked,
  selectIsGaslessInstantBlocked
} from 'store/posthog'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import GaslessService from 'services/gasless/GaslessService'
import Logger from 'utils/Logger'
import { SentryTag } from 'services/sentry/types'
import NetworkService from 'services/network/NetworkService'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { resolve } from '@avalabs/core-utils-sdk'
import AnalyticsService from 'services/analytics/AnalyticsService'

type Params = {
  maxFeePerGas: bigint | undefined
  maxPriorityFeePerGas: bigint | undefined
  gasLimit: number | undefined
  overrideData: string | undefined
  signingData: SigningData
  caip2ChainId: string
}

type Return = {
  gaslessEnabled: boolean
  setGaslessEnabled: React.Dispatch<React.SetStateAction<boolean>>
  shouldShowGaslessSwitch: boolean
  gaslessError: string | null
  handleGaslessTx: (addressFrom: string) => Promise<string | undefined>
}

export const useGasless = ({
  signingData,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasLimit,
  overrideData,
  caip2ChainId
}: Params): Return => {
  const { getNetwork } = useNetworks()
  const chainId = getChainIdFromCaip2(caip2ChainId)
  const network = getNetwork(chainId)
  const [isGaslessEligible, setIsGaslessEligible] = useState(false)
  const [gaslessEnabled, setGaslessEnabled] = useState(false)
  const isGaslessBlocked = useSelector(selectIsGaslessBlocked)
  const isGaslessInstantBlocked = useSelector(selectIsGaslessInstantBlocked)
  const [gaslessError, setGaslessError] = useState<string | null>(null)

  const shouldShowGaslessSwitch = useMemo(() => {
    return !isGaslessBlocked && !gaslessError && isGaslessEligible
  }, [gaslessError, isGaslessBlocked, isGaslessEligible])

  useEffect(() => {
    const checkGaslessEligibility = async (): Promise<void> => {
      if (!chainId) {
        setIsGaslessEligible(false)
        return
      }
      const isEthSendTx = GaslessService.isEthSendTx(signingData)
      const fromAddress =
        isEthSendTx && signingData.data.from != null
          ? String(signingData.data.from)
          : undefined
      const nonce =
        isEthSendTx && signingData.data.nonce != null
          ? Number(signingData.data.nonce)
          : undefined
      const isEligibleForChain = await GaslessService.isEligibleForChain(
        chainId.toString(),
        fromAddress,
        nonce
      ).catch(err => {
        Logger.error('Error checking gasless eligibility', err)
        return false
      })

      const isEligibleForTxType =
        GaslessService.isEligibleForTxType(signingData)
      const isEligible = isEligibleForTxType && isEligibleForChain
      Logger.info('ApprovalPopup: Gasless eligibility', isEligible)
      setIsGaslessEligible(isEligible)
    }
    checkGaslessEligibility()
  }, [chainId, signingData])

  const showGaslessError = useCallback(() => {
    setGaslessError(
      'Core was unable to fund the gas. You will need to pay the gas fee to continue with this transaction. '
    )
    setGaslessEnabled(false)
  }, [])

  const handleGaslessTx = async (
    addressFrom: string
  ): Promise<string | undefined> => {
    let attempts = 0
    const MAX_ATTEMPTS = 1

    if (!network || !chainId) {
      showGaslessError()
      return undefined
    }
    const provider = await NetworkService.getProviderForNetwork(network)
    if (!(provider instanceof JsonRpcBatchInternal)) {
      showGaslessError()
      return undefined
    }

    while (attempts <= MAX_ATTEMPTS) {
      const [result, error] = await resolve(
        GaslessService.fundTx({
          signingData,
          addressFrom,
          chainId,
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit,
          overrideData,
          provider,
          waitForConfirmation: isGaslessInstantBlocked
        })
      )

      if (result?.txHash) {
        AnalyticsService.capture('GaslessFundSuccessful', {
          fundTxHash: result?.txHash
        })
        setGaslessError(null)
        return result.txHash
      }

      // Show error and stop if we get a DO_NOT_RETRY error or
      // if we've hit max attempts with a RETRY_WITH_NEW_CHALLENGE error
      if (
        error ||
        result?.error?.category === 'DO_NOT_RETRY' ||
        (result?.error?.category === 'RETRY_WITH_NEW_CHALLENGE' &&
          attempts === MAX_ATTEMPTS)
      ) {
        const errorMessage = error
          ? String(error)
          : result?.error?.message ?? 'unknown'
        const errorCategory = result?.error?.category ?? 'unknown'
        AnalyticsService.capture('GaslessFundFailed', {
          errorMessage,
          errorCategory
        })
        Logger.error(`[useGasless.ts][handleGaslessTx]${errorMessage}`, error, {
          source: SentryTag.GasStation
        })
        showGaslessError()
        return undefined
      }

      attempts++
    }
    return undefined
  }

  return {
    gaslessEnabled,
    setGaslessEnabled,
    shouldShowGaslessSwitch,
    gaslessError,
    handleGaslessTx
  }
}
