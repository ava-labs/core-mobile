import { NetworkTokenWithBalance, TokenType } from '@avalabs/vm-module-types'
import { useCallback } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { assertNotUndefined } from 'utils/assertions'
import { useEVMProvider } from 'hooks/networks/networkProviderHooks'
import { selectIsGaslessBlocked } from 'store/posthog'
import { useSelector } from 'react-redux'
import { useSendContext } from 'new/features/send/context/sendContext'
import { useSendSelectedToken } from 'new/features/send/store'
import { NftItem } from 'services/nft/types'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { SendAdapterEVM, SendErrorMessage } from '../utils/types'
import { send as sendEVM } from '../utils/evm/send'
import { getGasLimit } from '../utils/evm/getGasLimit'
import {
  validateBasicInputs,
  validateERC1155,
  validateERC721,
  validateGasLimit,
  validateSupportedToken
} from '../utils/evm/validate'

const useCollectibleSend: SendAdapterEVM = ({
  chainId,
  fromAddress,
  nativeToken
}) => {
  const { request } = useInAppRequest()
  const { setError, setIsSending, amount, network, maxFee } = useSendContext()

  const [selectedToken] = useSendSelectedToken()
  const provider = useEVMProvider(network)
  const isGaslessBlocked = useSelector(selectIsGaslessBlocked)

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

  const validate = useCallback(
    async ({
      toAddress,
      from,
      token,
      p,
      nt
    }: {
      toAddress: string
      from: string
      token: NftItem
      p: JsonRpcBatchInternal
      nt: NetworkTokenWithBalance
    }) => {
      try {
        // For ERC-20 and native tokens, we want to know the max. transfer amount
        // even if the validation as a whole fails (e.g. user did not provide
        // the target address yet).
        const gasLimit = await getGasLimit({
          fromAddress: from,
          provider: p,
          toAddress, // gas used for transfer will be the same no matter the target address
          amount: amount?.toSubUnit() ?? 0n, // the amount does not change the gas costs
          token
        })

        if (token.type === TokenType.ERC721) {
          validateERC721(nt)
        } else if (token.type === TokenType.ERC1155) {
          validateERC1155(token, nt)
        }

        validateGasLimit(gasLimit)

        setError(undefined)
      } catch (err) {
        handleError(err)
      }
    },
    [amount, setError, handleError]
  )

  const send = useCallback(
    async (toAddress: string) => {
      try {
        assertNotUndefined(selectedToken)
        assertNotUndefined(toAddress)
        assertNotUndefined(provider)
        assertNotUndefined(chainId)
        assertNotUndefined(nativeToken)
        assertNotUndefined(maxFee)

        validateSupportedToken(selectedToken)
        validateBasicInputs(selectedToken, toAddress, maxFee)

        validate({
          toAddress,
          from: fromAddress,
          token: selectedToken as NftItem,
          p: provider,
          nt: nativeToken
        })

        setIsSending(true)

        return await sendEVM({
          request,
          fromAddress,
          chainId,
          provider,
          token: selectedToken,
          toAddress,
          amount: amount?.toSubUnit()
        })
      } finally {
        setIsSending(false)
      }
    },
    [
      selectedToken,
      provider,
      chainId,
      nativeToken,
      maxFee,
      validate,
      fromAddress,
      setIsSending,
      request,
      amount
    ]
  )

  return {
    send
  }
}

export default useCollectibleSend
