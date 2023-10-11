import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ContractCall,
  DisplayValueParserProps,
  Transaction,
  TransactionDisplayValues
} from 'screens/rpc/util/types'
import { MaxUint256, Result, TransactionDescription } from 'ethers'
import { FeePreset } from 'components/NetworkFeeSelector'
import { calculateGasAndFees } from 'utils/Utils'
import { bnToLocaleString, hexToBN } from '@avalabs/utils-sdk'
import {
  getTxInfo,
  isTxDescriptionError
} from 'screens/rpc/util/getTransactionInfo'
import { contractParserMap } from 'contracts/contractParsers/contractParserMap'
import {
  isTxParams,
  parseDisplayValues
} from 'screens/rpc/util/parseDisplayValues'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import Web3 from 'web3'
import { Limit, SpendLimit } from 'components/EditSpendLimit'
import Logger from 'utils/Logger'
import { NetworkTokenWithBalance } from 'store/balance'
import { Network } from '@avalabs/chains-sdk'
import { useFindToken } from 'contracts/contractParsers/utils/useFindToken'
import BN from 'bn.js'
import { CoreTypes } from '@walletconnect/types'
import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNativeTokenPriceForNetwork } from 'hooks/useNativeTokenPriceForNetwork'

export const UNLIMITED_SPEND_LIMIT_LABEL = 'Unlimited'

interface ExplainTransactionSharedTypes {
  setSpendLimit: (customSpendData: SpendLimit) => void
  contractType: ContractCall | undefined
  selectedGasFee: FeePreset
  displayData: TransactionDisplayValues
  setCustomFee: (
    gasPrice: bigint,
    modifier: FeePreset,
    gasLimit: number
  ) => void
  transaction: Transaction | null
  customSpendLimit: SpendLimit
}

type Args = {
  txParams: TransactionParams | undefined
  network: Network | undefined
  peerMeta: CoreTypes.Metadata | null
  onError: (error?: string) => void
}

export const useExplainTransactionShared = (
  args: Args
): ExplainTransactionSharedTypes => {
  const { network, txParams, peerMeta, onError } = args
  const { data: networkFees } = useNetworkFee(network)
  const { nativeTokenPrice: tokenPrice } =
    useNativeTokenPriceForNetwork(network)
  const token = network?.networkToken
  const findToken = useFindToken(network)

  const [transaction, setTransaction] = useState<Transaction | null>(null)

  const [customGas, setCustomGas] = useState<{
    gasLimit: number
    gasPrice: bigint
  } | null>(null)
  const [defaultSpendLimit, setDefaultSpendLimit] = useState<BN>()

  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    limitType: Limit.DEFAULT
  })
  const [selectedGasFee, setSelectedGasFee] = useState<FeePreset>(
    FeePreset.Instant
  )

  const setCustomFee = useCallback(
    (gasPrice: bigint, modifier: FeePreset, gasLimit: number) => {
      setCustomGas({ gasLimit, gasPrice })
      setSelectedGasFee(modifier)
      const feeDisplayValues = calculateGasAndFees({
        gasPrice,
        gasLimit,
        tokenPrice,
        tokenDecimals: network?.networkToken.decimals
      })

      // update transaction
      setTransaction(currentTransaction => {
        if (currentTransaction === null) return null

        return {
          ...currentTransaction,
          txParams: {
            ...currentTransaction.txParams,
            gasLimit: feeDisplayValues.gasLimit,
            gasPrice: feeDisplayValues.gasPrice.toString(16) // test this
          }
        }
      })
    },
    [tokenPrice, network?.networkToken?.decimals]
  )

  const setSpendLimit = useCallback(
    (customSpendData: SpendLimit) => {
      if (transaction) {
        const srcTokenAddress: string =
          transaction.displayValues?.tokenToBeApproved?.address
        const spenderAddress: string =
          transaction.displayValues?.approveData.spender
        let limitAmount = ''

        if (customSpendData.limitType === Limit.UNLIMITED) {
          setCustomSpendLimit({
            limitType: Limit.UNLIMITED,
            value: undefined
          })
          limitAmount = MaxUint256.toString(16)
        } else if (customSpendData.limitType === Limit.DEFAULT) {
          const bn = defaultSpendLimit || new BN(0)
          setCustomSpendLimit({
            limitType: Limit.DEFAULT,
            value: {
              bn,
              amount: bnToLocaleString(
                bn,
                transaction.displayValues?.tokenToBeApproved?.decimals
              )
            }
          })
          limitAmount = transaction?.displayValues?.approveData?.limit
        } else {
          setCustomSpendLimit(customSpendData)

          limitAmount =
            customSpendData.value?.bn.toString() || new BN(0).toString()
        }

        const web3 = new Web3()

        const contract = new web3.eth.Contract(
          ERC20.abi as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          srcTokenAddress
        )

        const hashedCustomSpend =
          limitAmount &&
          contract.methods.approve(spenderAddress, limitAmount).encodeABI()

        const updatedTransaction = {
          ...transaction,
          txParams: {
            ...transaction.txParams,
            data: hashedCustomSpend
          }
        }
        // update transaction
        setTransaction(updatedTransaction)
      }
    },
    [transaction, setTransaction, defaultSpendLimit]
  )

  /******************************************************************************
   * Load transaction information
   *****************************************************************************/
  useEffect(() => {
    // TODO: determine why loadTx render multiple times on Token Spend Approval
    async function loadTx(): Promise<void> {
      if (!network) throw Error('Invalid network')

      // Get transaction description from ABIs
      const txDescription = await getTxDescription(network, txParams)

      if (!txParams || !isTxParams(txParams)) {
        throw Error('Invalid transaction params')
      }

      // These are the default props we'll feed into the display parser later on
      const displayValueProps: DisplayValueParserProps = {
        gasPrice: networkFees.low,
        tokenPrice, // price in currency
        token: token as NetworkTokenWithBalance,
        site: peerMeta
      }

      // some requests will have a missing gasLimit so we need to ensure it's there
      let gasLimit: number | null

      if (txParams.gas) {
        gasLimit = Number(txParams.gas)
      } else {
        gasLimit = await getEstimatedGasLimit(txParams, network).catch(e => {
          Logger.error('failed to calculate gas limit', e)
          throw Error('Unable to calculate gas limit')
        })
      }
      // create txParams that includes gasLimit
      const txParamsWithGasLimit = getTxParamsWithGasLimit(gasLimit, txParams)

      const { functionName, decodedData, description } =
        extractParamsForContractParser(txDescription)

      // Get parser based on function name
      const parser = contractParserMap.get(functionName)

      // this is the simplified display values which
      // will be used to on the views.
      // uses a custom parser if there is one, otherwise
      // uses `parseDisplayValues` as a generic parser.
      let displayValues: TransactionDisplayValues
      try {
        displayValues = parser
          ? await parser(
              findToken,
              network,
              txParamsWithGasLimit,
              decodedData,
              displayValueProps,
              description
            )
          : parseDisplayValues(
              network,
              txParamsWithGasLimit,
              displayValueProps,
              description
            )
      } catch (err) {
        Logger.error('failed to parse transaction', err)
        displayValues = parseDisplayValues(
          network,
          txParamsWithGasLimit,
          displayValueProps,
          description
        )
      }

      const defaultLimitBN = getDefaultLimitBN(displayValues)
      if (!defaultSpendLimit) {
        setDefaultSpendLimit(defaultLimitBN)

        setCustomSpendLimit({
          limitType: Limit.DEFAULT,
          value: {
            bn: defaultLimitBN,
            amount: bnToLocaleString(
              defaultLimitBN,
              displayValues.tokenToBeApproved?.decimals
            )
          }
        })
      }

      setTransaction({
        txParams: txParamsWithGasLimit,
        displayValues: displayValues
      })
    }

    loadTx().catch(err => {
      onError(err?.error || err.message)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    network,
    token,
    findToken,
    networkFees,
    peerMeta,
    tokenPrice,
    txParams,
    onError
  ])

  const feeDisplayValues = useMemo(() => {
    return (
      networkFees &&
      transaction?.displayValues?.gasLimit &&
      calculateGasAndFees({
        gasPrice: customGas?.gasPrice ?? networkFees.low,
        gasLimit: customGas?.gasLimit ?? transaction.displayValues.gasLimit,
        tokenPrice,
        tokenDecimals: network?.networkToken.decimals
      })
    )
  }, [
    network?.networkToken.decimals,
    customGas?.gasLimit,
    customGas?.gasPrice,
    networkFees,
    tokenPrice,
    transaction?.displayValues?.gasLimit
  ])

  const displayData: TransactionDisplayValues = useMemo(() => {
    const data = {
      ...transaction?.displayValues,
      ...(transaction?.txParams ? { txParams: transaction.txParams } : {}),
      ...feeDisplayValues
    }

    delete data.contractType

    return data
  }, [feeDisplayValues, transaction?.displayValues, transaction?.txParams])

  return {
    displayData,
    contractType: transaction?.displayValues?.contractType,
    transaction,
    setCustomFee,
    setSpendLimit,
    customSpendLimit,
    selectedGasFee
  }
}

const getDefaultLimitBN = (displayValues: TransactionDisplayValues): BN => {
  return hexToBN(displayValues.approveData?.limit ?? '0')
}

const getTxDescription = async (
  network: Network,
  txParams?: TransactionParams
): Promise<
  | TransactionDescription
  | {
      error: string
    }
> => {
  return await getTxInfo(
    txParams?.to?.toLocaleLowerCase() ?? '',
    txParams?.data ?? '',
    txParams?.value ?? '',
    network
  )
}

const getFunctionName = (txDescription: TransactionDescription): string => {
  return txDescription?.name ?? txDescription?.fragment?.name ?? ''
}

const getTxParamsWithGasLimit = (
  gasLimit: number | null,
  txParams: TransactionParams
): TransactionParams => {
  return gasLimit ? { ...txParams, gas: gasLimit } : txParams
}

const extractParamsForContractParser = (
  txDescription:
    | TransactionDescription
    | {
        error: string
      }
): {
  functionName: string
  description?: TransactionDescription
  decodedData?: Result
} => {
  if (!isTxDescriptionError(txDescription)) {
    return {
      decodedData: txDescription.args,
      description: txDescription,
      functionName: getFunctionName(txDescription)
    }
  }
  return { decodedData: undefined, description: undefined, functionName: '' }
}

const getEstimatedGasLimit = (
  txParams: TransactionParams,
  network: Network
): Promise<number | null> => {
  return NetworkFeeService.estimateGasLimit({
    from: txParams.from,
    to: txParams.to,
    data: txParams.data,
    value: txParams.value,
    network
  })
}
