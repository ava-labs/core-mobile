import { useCallback, useEffect, useState } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { UnsignedTx } from '@avalabs/avalanchejs'
import WalletService from 'services/wallet/WalletService'
import { stripChainAddress } from 'store/account/utils'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useGetFeeState } from 'hooks/earn/useGetFeeState'
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
  const { getFeeState } = useGetFeeState()
  const [estimatedFee, setEstimatedFee] = useState<bigint>()

  const provider = useAvalancheXpProvider()

  const createSendPTx = useCallback(
    async (amountInNAvax: bigint, price?: bigint): Promise<UnsignedTx> => {
      const destinationAddress = 'P-' + stripChainAddress(toAddress ?? '')
      return await WalletService.createSendPTx({
        accountIndex: account.index,
        amountInNAvax,
        avaxXPNetwork: network,
        destinationAddress: destinationAddress,
        sourceAddress: fromAddress,
        feeState: getFeeState(price)
      })
    },
    [toAddress, account.index, network, fromAddress, getFeeState]
  )

  useEffect(() => {
    const getEstimatedFee = async (): Promise<void> => {
      if (!toAddress || !token || !amount) {
        return Promise.reject('missing required fields')
      }
      if (provider) {
        const unsignedTx = await createSendPTx(amount.bn, maxFee)
        const tx = await Avalanche.parseAvalancheTx(
          unsignedTx,
          provider,
          fromAddress
        )
        setEstimatedFee(tx.txFee)
      }
    }
    getEstimatedFee().catch(Logger.error)
  }, [
    amount,
    createSendPTx,
    fromAddress,
    maxFee,
    provider,
    setError,
    toAddress,
    token
  ])

  const send = useCallback(async () => {
    if (!toAddress || !token || !amount) {
      return Promise.reject('missing required fields')
    }

    try {
      setIsSending(true)
      return await sendPVM({
        request,
        network,
        fromAddress,
        accountIndex: account.index,
        amountInNAvax: amount.bn,
        toAddress,
        feeState: getFeeState(gasPrice)
      })
    } finally {
      setIsSending(false)
    }
  }, [
    toAddress,
    token,
    amount,
    setIsSending,
    request,
    network,
    fromAddress,
    account.index,
    getFeeState,
    gasPrice
  ])

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
    try {
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
    setError,
    maxFee,
    amount?.bn,
    toAddress,
    token,
    gasPrice,
    estimatedFee,
    handleError
  ])

  // TODO: use correct max amount for P-chain
  const getMaxAmount = useCallback(async () => {
    if (!token || !isTokenWithBalancePVM(token)) {
      return
    }

    const fee = maxFee ? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee : 0n

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
