import { TokenType } from '@avalabs/vm-module-types'
import { useCallback, useEffect } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { assertNotUndefined } from 'utils/assertions'
import { useEVMProvider } from 'hooks/networks/networkProviderHooks'
import { SendAdapterEVM, SendErrorMessage } from '../utils/types'
import { send as sendEVM } from '../utils/evm/send'
import { getGasLimit } from '../utils/evm/getGasLimit'
import {
  validateBasicInputs,
  validateERC1155,
  validateERC721,
  validateAmount,
  validateGasLimit,
  validateSupportedToken
} from '../utils/evm/validate'

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

  const send = useCallback(async () => {
    try {
      assertNotUndefined(token)
      assertNotUndefined(toAddress)
      assertNotUndefined(provider)

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
        setError(err.message)
      } else {
        setError(SendErrorMessage.UNKNOWN_ERROR)
      }
    },
    [setError]
  )

  const validate = useCallback(async () => {
    try {
      validateBasicInputs(token, toAddress, maxFee)

      assertNotUndefined(token)
      assertNotUndefined(toAddress)
      assertNotUndefined(provider)

      validateSupportedToken(token)

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
          gasLimit,
          amount: amount?.bn,
          token,
          maxFee,
          nativeToken,
          onCalculateMaxAmount: setMaxAmount
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
    setMaxAmount,
    token,
    toAddress,
    amount
  ])

  useEffect(() => {
    if (canValidate) {
      validate()
    }
  }, [validate, canValidate])

  return {
    send
  }
}

export default useEVMSend
