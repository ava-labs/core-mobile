import { useCallback, useEffect, useMemo } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { assertNotUndefined } from 'utils/assertions'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { isTokenWithBalanceAVM } from '@avalabs/avalanche-module'
import Logger from 'utils/Logger'
import { useSendContext } from 'new/features/send/context/sendContext'
import { useSendSelectedToken } from 'new/features/send/store'
import { SendAdapterAVM, SendErrorMessage } from './utils/types'
import { send as sendAVM } from './utils/avm/send'
import { validate as validateAVMSend } from './utils/avm/validate'

const useAVMSend: SendAdapterAVM = ({
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
    amount,
    addressToSend,
    canValidate
  } = useSendContext()
  const [selectedToken] = useSendSelectedToken()

  const tokenProps = useMemo(() => {
    if (!selectedToken || !isTokenWithBalanceAVM(selectedToken)) {
      return { decimals: undefined, symbol: undefined }
    }
    return { decimals: selectedToken.decimals, symbol: selectedToken.symbol }
  }, [selectedToken])

  const send = useCallback(async () => {
    try {
      assertNotUndefined(addressToSend)
      assertNotUndefined(amount)
      assertNotUndefined(network)

      setIsSending(true)

      return await sendAVM({
        request,
        fromAddress,
        account,
        network,
        toAddress: addressToSend,
        amount: amount.toSubUnit()
      })
    } finally {
      setIsSending(false)
    }
  }, [
    request,
    fromAddress,
    network,
    account,
    setIsSending,
    addressToSend,
    amount
  ])

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(SendErrorMessage.UNKNOWN_ERROR)
      }
    },
    [setError]
  )

  const validate = useCallback(async () => {
    assertNotUndefined(maxFee)
    try {
      validateAVMSend({
        amount: amount?.toSubUnit(),
        address: addressToSend,
        maxFee,
        token: selectedToken as TokenWithBalanceAVM
      })

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [maxFee, setError, handleError, addressToSend, amount, selectedToken])

  const getMaxAmount = useCallback(async () => {
    if (!selectedToken || !isTokenWithBalanceAVM(selectedToken)) {
      return
    }

    const fee = maxFee ? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee : 0n

    const balance = selectedToken.available ?? 0n
    const maxAmountValue = balance - fee
    const maxAmount = maxAmountValue > 0n ? maxAmountValue : 0n
    return new TokenUnit(
      maxAmount,
      selectedToken.decimals,
      selectedToken.symbol
    )
  }, [maxFee, selectedToken])

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
  }, [getMaxAmount, tokenProps.decimals, tokenProps.symbol, setMaxAmount])

  return {
    send
  }
}

export default useAVMSend
