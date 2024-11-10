import { useCallback, useEffect, useState } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import NetworkService from 'services/network/NetworkService'
import { isDevnet } from 'utils/isDevnet'
import { pvm, UnsignedTx } from '@avalabs/avalanchejs'
import WalletService from 'services/wallet/WalletService'
import { stripChainAddress } from 'store/account/utils'
import { SendAdapterPVM, SendErrorMessage } from '../utils/types'
import { send as sendPVM } from '../utils/pvm/send'
import { validate as validatePVMSend } from '../utils/pvm/validate'

const usePVMSend: SendAdapterPVM = ({
  network,
  maxFee,
  account,
  fromAddress
}) => {
  const { request } = useInAppRequest()
  const {
    setMaxAmount,
    setError,
    setIsSending,
    token,
    toAddress,
    amount,
    canValidate
  } = useSendContext()
  const [gasPrice, setGasPrice] = useState<bigint>()
  const [feeState, setFeeState] = useState<pvm.FeeState>()

  const [estimatedFee, setEstimatedFee] = useState<bigint>()

  const [provider, setProvider] = useState<Avalanche.JsonRpcProvider>()

  useEffect(() => {
    const getProvider = async (): Promise<void> => {
      const p = await NetworkService.getAvalancheProviderXP(
        !!network.isTestnet,
        isDevnet(network)
      )
      setProvider(p)
    }
    getProvider()
  }, [network])

  useEffect(() => {
    if (provider && provider.isEtnaEnabled()) {
      provider
        .getApiP()
        .getFeeState()
        .then(state => {
          setFeeState(state)
        })
        .catch(() => {
          setError(SendErrorMessage.INVALID_NETWORK_FEE)
        })
    } else {
      setFeeState(undefined)
    }
  }, [provider, setError])

  const getFeeState = useCallback(
    (p?: bigint) => {
      if (p && feeState) {
        return {
          ...feeState,
          price: p
        }
      }
      if (p === undefined && feeState) {
        return feeState
      }
      return undefined
    },
    [feeState]
  )

  const createSendPTx = useCallback(
    async (price?: bigint): Promise<UnsignedTx> => {
      if (!toAddress || !token || !amount) {
        return Promise.reject('missing required fields')
      }
      const destinationAddress = 'P-' + stripChainAddress(toAddress ?? '')
      return await WalletService.createSendPTx({
        accountIndex: account.index,
        amountInNAvax: amount.bn,
        avaxXPNetwork: network,
        destinationAddress: destinationAddress,
        sourceAddress: fromAddress,
        feeState: getFeeState(price)
      })
    },
    [toAddress, token, amount, account.index, network, fromAddress, getFeeState]
  )

  const send = useCallback(async () => {
    try {
      setIsSending(true)
      const unsignedTx = await createSendPTx(gasPrice)

      return await sendPVM({
        request,
        network,
        fromAddress,
        unsignedTx
      })
    } finally {
      setIsSending(false)
    }
  }, [setIsSending, createSendPTx, gasPrice, request, network, fromAddress])

  const handleError = useCallback(
    (err: unknown): void => {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(SendErrorMessage.UNKNOWN_ERROR)
      }
    },
    [setError]
  )

  const validate = useCallback(async () => {
    if (!provider) return
    setError(undefined)

    try {
      const unsignedTx = await createSendPTx(maxFee)
      const tx = await Avalanche.parseAvalancheTx(
        unsignedTx,
        provider,
        fromAddress
      )
      setEstimatedFee(tx.txFee)
      validatePVMSend({
        amount: amount?.bn ?? 0n,
        address: toAddress,
        maxFee,
        token: token as TokenWithBalancePVM,
        gasPrice,
        estimatedFee
      })

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [
    provider,
    setError,
    createSendPTx,
    maxFee,
    fromAddress,
    amount?.bn,
    toAddress,
    token,
    gasPrice,
    estimatedFee,
    handleError
  ])

  const getMaxAmount = useCallback(async () => {
    if (!token || !isTokenWithBalancePVM(token)) {
      return
    }

    const fee = maxFee ? BigInt(GAS_LIMIT_FOR_XP_CHAIN) * maxFee : 0n

    const balance = token.available ?? 0n
    const maxAmountValue = balance - fee
    const maxAmount = maxAmountValue > 0n ? maxAmountValue : 0n

    return {
      bn: maxAmount,
      amount: bigIntToString(maxAmount, token.decimals)
    }
  }, [maxFee, token])

  useEffect(() => {
    if (canValidate) {
      validate()
    }
  }, [validate, canValidate])

  useEffect(() => {
    getMaxAmount()
      .then(maxAmount => {
        if (maxAmount) {
          setMaxAmount(maxAmount)
        }
      })
      .catch(Logger.error)
  }, [getMaxAmount, setMaxAmount])

  return {
    send,
    provider,
    estimatedFee,
    setGasPrice
  }
}

export default usePVMSend
