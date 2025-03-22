import { TokenType } from '@avalabs/vm-module-types'
import { useCallback, useEffect } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { assertNotUndefined } from 'utils/assertions'
import { useEVMProvider } from 'hooks/networks/networkProviderHooks'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import { selectIsGaslessBlocked } from 'store/posthog'
import { useSelector } from 'react-redux'
import { SendAdapterEVM, SendErrorMessage } from '../utils/types'
import { send as sendEVM } from '../utils/evm/send'
import { getGasLimit } from '../utils/evm/getGasLimit'
import {
  validateBasicInputs,
  validateERC1155,
  validateERC721,
  validateAmount,
  validateFee,
  validateGasLimit,
  validateSupportedToken
} from '../utils/evm/validate'
import { isSupportedToken } from '../utils/evm/typeguard'

const useEVMSend: SendAdapterEVM = ({
  chainId,
  fromAddress,
  network,
  maxFee,
  nativeToken
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
  const provider = useEVMProvider(network)
  const isGaslessBlocked = useSelector(selectIsGaslessBlocked)

  const send = useCallback(async () => {
    try {
      assertNotUndefined(token)
      assertNotUndefined(toAddress)
      assertNotUndefined(provider)
      validateSupportedToken(token)
      setIsSending(true)

      return await sendEVM({
        request,
        fromAddress,
        chainId,
        provider,
        token,
        toAddress,
        amount: amount?.bn
      })
    } finally {
      setIsSending(false)
    }
  }, [
    request,
    chainId,
    fromAddress,
    provider,
    setIsSending,
    token,
    toAddress,
    amount
  ])

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof Error) {
        if (
          !isGaslessBlocked &&
          err.message === SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE
        ) {
          setError(undefined)
          return
        }
        setError(err.message)
      } else {
        setError(SendErrorMessage.UNKNOWN_ERROR)
      }
    },
    [setError, isGaslessBlocked]
  )

  const validate = useCallback(async () => {
    try {
      assertNotUndefined(token)
      validateSupportedToken(token)
      validateBasicInputs(token, toAddress, maxFee)
      assertNotUndefined(toAddress)
      assertNotUndefined(provider)

      // For ERC-20 and native tokens, we want to know the max. transfer amount
      // even if the validation as a whole fails (e.g. user did not provide
      // the target address yet).
      const gasLimit = await getGasLimit({
        fromAddress,
        provider,
        toAddress, // gas used for transfer will be the same no matter the target address
        amount: amount?.bn ?? 0n, // the amount does not change the gas costs
        token
      })

      if (token.type === TokenType.ERC721) {
        validateERC721(nativeToken)
      } else if (token.type === TokenType.ERC1155) {
        validateERC1155(token, nativeToken)
      } else if (
        token.type === TokenType.NATIVE ||
        token.type === TokenType.ERC20
      ) {
        validateAmount({
          amount: amount?.bn,
          token
        })
        validateFee({
          gasLimit,
          maxFee,
          amount: amount?.bn,
          nativeToken,
          token
        })
      }

      validateGasLimit(gasLimit)

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [
    nativeToken,
    fromAddress,
    provider,
    handleError,
    setError,
    maxFee,
    token,
    toAddress,
    amount
  ])

  const getMaxAmount = useCallback(async () => {
    if (!provider || !toAddress || !token || !isSupportedToken(token)) {
      return
    }

    const gasLimit = await getGasLimit({
      fromAddress,
      provider,
      toAddress,
      amount: amount?.bn ?? 0n,
      token
    })

    const totalFee = gasLimit * maxFee
    const maxAmountValue = nativeToken.balance - totalFee

    if (token.type === TokenType.NATIVE) {
      return {
        bn: maxAmountValue ?? 0n,
        amount: maxAmountValue
          ? bigIntToString(maxAmountValue, nativeToken.decimals)
          : ''
      }
    } else if (token.type === TokenType.ERC20) {
      return {
        bn: token.balance,
        amount: bigIntToString(token.balance, token.decimals)
      }
    }
  }, [amount, fromAddress, maxFee, nativeToken, provider, toAddress, token])

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

export default useEVMSend
