import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'features/send/context/sendContext'
import { useCallback, useEffect } from 'react'
import { assertNotUndefined } from 'utils/assertions'
import { useSendSelectedToken } from 'features/send/store'
import { useSVMProvider } from 'hooks/networks/networkProviderHooks'
import { TokenType, TokenWithBalanceSPL } from '@avalabs/vm-module-types'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import Logger from 'utils/Logger'
import { SendAdapterSVM, SendErrorMessage } from './utils/types'
import {
  validateAddress,
  validateSupportedToken,
  validateAmount,
  validateDestinationAccountRentExempt
} from './utils/svm/validate'
import { send as sendSVM } from './utils/svm/send'
import { SOLANA_FIXED_BASE_FEE } from './utils/svm/constants'
import { isSupportedSVMToken } from './utils/svm/typeguard'

const useSVMSend: SendAdapterSVM = ({
  fromAddress,
  network,
  account,
  nativeToken
}) => {
  const { request } = useInAppRequest()

  const {
    setError,
    setIsSending,
    addressToSend,
    amount,
    canValidate,
    setMaxAmount,
    setMinAmount
  } = useSendContext()

  const [selectedToken] = useSendSelectedToken()
  const provider = useSVMProvider(network)

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

  const getMaxAmount = useCallback(async () => {
    if (
      !provider ||
      !addressToSend ||
      !selectedToken ||
      nativeToken === undefined ||
      !isSupportedSVMToken(selectedToken)
    ) {
      return
    }

    const amountBigInt = amount?.toSubUnit() ?? 0n
    const remainingBalance = selectedToken.balance - amountBigInt

    if (remainingBalance < 0n) {
      throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
    }

    if (selectedToken.type === TokenType.NATIVE) {
      return new TokenUnit(
        selectedToken.balance - SOLANA_FIXED_BASE_FEE,
        nativeToken.decimals,
        nativeToken.symbol
      )
    } else {
      const splToken = selectedToken as TokenWithBalanceSPL
      return new TokenUnit(splToken.balance, splToken.decimals, splToken.symbol)
    }
  }, [provider, addressToSend, selectedToken, nativeToken, amount])

  const validate = useCallback(async () => {
    try {
      assertNotUndefined(selectedToken)
      assertNotUndefined(addressToSend)
      assertNotUndefined(provider)
      assertNotUndefined(network)
      assertNotUndefined(nativeToken)
      validateSupportedToken(selectedToken)

      validateAddress({
        address: addressToSend
      })

      validateAmount({
        amount: amount,
        selectedTokenBalance: selectedToken.balance
      })

      if (selectedToken.type === TokenType.NATIVE) {
        await validateDestinationAccountRentExempt({
          addressToSend,
          amount,
          provider,
          token: nativeToken,
          setMinAmount
        })
      }

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [
    selectedToken,
    addressToSend,
    provider,
    network,
    nativeToken,
    amount,
    setError,
    setMinAmount,
    handleError
  ])

  const send = useCallback(async () => {
    try {
      assertNotUndefined(selectedToken)
      assertNotUndefined(addressToSend)
      assertNotUndefined(provider)
      assertNotUndefined(network)
      validateSupportedToken(selectedToken)
      setIsSending(true)

      return await sendSVM({
        request,
        fromAddress,
        provider,
        token: selectedToken,
        toAddress: addressToSend,
        amount: amount?.toSubUnit(),
        chainId: network.chainId,
        account
      })
    } catch (error) {
      handleError(error)
      throw error
    } finally {
      setIsSending(false)
    }
  }, [
    selectedToken,
    addressToSend,
    provider,
    fromAddress,
    network,
    setIsSending,
    request,
    amount,
    handleError,
    account
  ])

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
    send
  }
}

export default useSVMSend
