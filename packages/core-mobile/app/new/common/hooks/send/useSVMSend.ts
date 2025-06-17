import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'features/send/context/sendContext'
import { useCallback, useEffect } from 'react'
import { assertNotUndefined } from 'utils/assertions'
import { useSendSelectedToken } from 'features/send/store'
import { useSVMProvider } from 'hooks/networks/networkProviderHooks'
import { TokenType, TokenWithBalanceSPL } from '@avalabs/vm-module-types'
import { isAddress, Address } from '@solana/kit'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { SolanaProvider } from '@avalabs/core-wallets-sdk'
import Logger from 'utils/Logger'
import { SendAdapterSVM, SendErrorMessage } from './utils/types'
import { validateSupportedToken } from './utils/svm/validate'
import { send as sendSVM } from './utils/svm/send'
import { SOLANA_FIXED_BASE_FEE } from './utils/svm/constants'
import { isSupportedSVMToken } from './utils/svm/typeguard'

const RENT_EXEMPT_CACHE = new Map<bigint, bigint>()
const ACCOUNT_SPACE_CACHE = new Map<Address, bigint>()

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
      validateSupportedToken(selectedToken)
      assertNotUndefined(addressToSend)
      assertNotUndefined(provider)
      assertNotUndefined(network)
      assertNotUndefined(nativeToken)

      const amountBigInt = amount?.toSubUnit() ?? 0n

      if (!amountBigInt || amountBigInt <= 0n) {
        throw new Error(SendErrorMessage.AMOUNT_REQUIRED)
      }

      if (!addressToSend) {
        throw new Error(SendErrorMessage.ADDRESS_REQUIRED)
      }

      if (!isAddress(addressToSend)) {
        throw new Error(SendErrorMessage.INVALID_ADDRESS)
      }

      if (selectedToken.type === TokenType.NATIVE) {
        const spaceOccupied = await getAccountOccupiedSpace(
          addressToSend,
          provider
        )

        // If the recipient account does not hold any data, the first transfer
        // must be greater than the rent-exempt minimum.
        if (spaceOccupied === 0n) {
          const rentExemptMinimum = await getRentExemptMinimum(0n, provider)

          const minAmount = new TokenUnit(
            rentExemptMinimum,
            nativeToken.decimals,
            nativeToken.symbol
          )

          setMinAmount(minAmount)

          if (amountBigInt < rentExemptMinimum) {
            throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
          }
        }

        const rentExemptMinimum = await getRentExemptMinimum(
          spaceOccupied,
          provider
        )

        if (amountBigInt < rentExemptMinimum) {
          throw new Error(SendErrorMessage.AMOUNT_TO_LOW)
        }
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

const getAccountOccupiedSpace = async (
  address: Address,
  provider: SolanaProvider
): Promise<bigint> => {
  const cached = ACCOUNT_SPACE_CACHE.get(address)

  if (cached) {
    return cached
  }

  const accountInfo = await provider.getAccountInfo(address).send()
  const space = accountInfo.value?.space ?? 0n
  ACCOUNT_SPACE_CACHE.set(address, space)

  return space
}

const getRentExemptMinimum = async (
  space: bigint,
  provider: SolanaProvider
): Promise<bigint> => {
  const cached = RENT_EXEMPT_CACHE.get(space)

  if (cached) {
    return cached
  }

  const rentExemptMinimum = await provider
    .getMinimumBalanceForRentExemption(0n)
    .send()

  RENT_EXEMPT_CACHE.set(0n, rentExemptMinimum)

  return rentExemptMinimum
}

export default useSVMSend
