import { TokenType } from '@avalabs/vm-module-types'
import { useCallback, useEffect } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { assertNotUndefined } from 'utils/assertions'
import { useEVMProvider } from 'hooks/networks/networkProviderHooks'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import { selectIsGaslessBlocked } from 'store/posthog'
import { useSelector } from 'react-redux'
import { useSendContext } from 'new/features/send/context/sendContext'
import { useSendSelectedToken } from 'new/features/send/store'
import { RequestContext } from 'store/rpc/types'
import { SendAdapterEVM, SendErrorMessage } from './utils/types'
import { send as sendEVM } from './utils/evm/send'
import { getGasLimit } from './utils/evm/getGasLimit'
import {
  validateBasicInputs,
  validateERC1155,
  validateERC721,
  validateAmount,
  validateFee,
  validateGasLimit,
  validateSupportedToken
} from './utils/evm/validate'
import { isSupportedToken } from './utils/evm/typeguard'

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
    addressToSend,
    amount,
    canValidate
  } = useSendContext()

  const [selectedToken] = useSendSelectedToken()
  const provider = useEVMProvider(network)
  const isGaslessBlocked = useSelector(selectIsGaslessBlocked)

  const send = useCallback(async () => {
    try {
      assertNotUndefined(selectedToken)
      assertNotUndefined(addressToSend)
      assertNotUndefined(provider)
      assertNotUndefined(chainId)
      validateSupportedToken(selectedToken)
      setIsSending(true)

      return await sendEVM({
        request,
        fromAddress,
        chainId,
        provider,
        token: selectedToken,
        toAddress: addressToSend,
        amount: amount?.toSubUnit(),
        context: {
          [RequestContext.NON_CONTRACT_RECIPIENT]: true
        }
      })
    } finally {
      setIsSending(false)
    }
  }, [
    chainId,
    fromAddress,
    addressToSend,
    selectedToken,
    provider,
    setIsSending,
    request,
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
      assertNotUndefined(selectedToken)
      validateSupportedToken(selectedToken)
      assertNotUndefined(nativeToken)
      assertNotUndefined(maxFee)
      validateBasicInputs(selectedToken, addressToSend, maxFee)
      assertNotUndefined(addressToSend)
      assertNotUndefined(provider)

      // For ERC-20 and native tokens, we want to know the max. transfer amount
      // even if the validation as a whole fails (e.g. user did not provide
      // the target address yet).
      const gasLimit = await getGasLimit({
        fromAddress,
        provider,
        toAddress: addressToSend, // gas used for transfer will be the same no matter the target address
        amount: amount?.toSubUnit() ?? 0n, // the amount does not change the gas costs
        token: selectedToken
      })

      if (selectedToken.type === TokenType.ERC721) {
        validateERC721(nativeToken)
      } else if (selectedToken.type === TokenType.ERC1155) {
        validateERC1155(selectedToken, nativeToken)
      } else if (
        selectedToken.type === TokenType.NATIVE ||
        selectedToken.type === TokenType.ERC20
      ) {
        validateAmount({
          amount: amount?.toSubUnit(),
          token: selectedToken
        })
        validateFee({
          gasLimit,
          maxFee,
          amount: amount?.toSubUnit(),
          nativeToken,
          token: selectedToken
        })
      }

      validateGasLimit(gasLimit)

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [
    selectedToken,
    addressToSend,
    maxFee,
    provider,
    fromAddress,
    amount,
    setError,
    nativeToken,
    handleError
  ])

  const getMaxAmount = useCallback(async () => {
    if (
      !provider ||
      !addressToSend ||
      !selectedToken ||
      nativeToken === undefined ||
      maxFee === undefined ||
      !isSupportedToken(selectedToken)
    ) {
      return
    }

    const gasLimit = await getGasLimit({
      fromAddress,
      provider,
      toAddress: addressToSend,
      amount: amount?.toSubUnit() ?? 0n,
      token: selectedToken
    })

    const totalFee = gasLimit * maxFee
    const maxAmountValue = nativeToken.balance - totalFee

    if (selectedToken.type === TokenType.NATIVE) {
      return new TokenUnit(
        maxAmountValue ?? 0n,
        nativeToken.decimals,
        nativeToken.symbol
      )
    } else if (selectedToken.type === TokenType.ERC20) {
      return new TokenUnit(
        selectedToken.balance,
        selectedToken.decimals,
        selectedToken.symbol
      )
    }
  }, [
    addressToSend,
    amount,
    fromAddress,
    maxFee,
    nativeToken,
    provider,
    selectedToken
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

export default useEVMSend
