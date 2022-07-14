import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DisplayValueParserProps,
  PeerMetadata,
  Transaction,
  TransactionDisplayValues,
  TransactionParams
} from 'screens/rpc/util/types'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { BigNumber, ethers } from 'ethers'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { FeePreset } from 'components/NetworkFeeSelector'
import { calculateGasAndFees } from 'utils/Utils'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
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
import networkFeeService from 'services/networkFee/NetworkFeeService'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import Web3 from 'web3'
import { Limit, SpendLimit } from 'components/EditSpendLimit'

const UNLIMITED_SPEND_LIMIT_LABEL = 'Unlimited'

export function useExplainTransaction(
  params: TransactionParams,
  peerMeta?: PeerMetadata
) {
  const { networkFees } = useNetworkFee()
  const tokenPrice = useNativeTokenPrice().nativeTokenPrice
  // const tokensWithBalance = useSelector(selectTokensWithBalance)
  const activeNetwork = useActiveNetwork()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [hash, setHash] = useState<string>('')
  const [customGas, setCustomGas] = useState<{
    gasLimit: number
    gasPrice: BigNumber
  } | null>(null)
  const [displaySpendLimit, setDisplaySpendLimit] = useState<string>(
    UNLIMITED_SPEND_LIMIT_LABEL
  )
  const [showCustomSpendLimit, setShowCustomSpendLimit] = useState(false)
  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    limitType: Limit.UNLIMITED
  })
  const [selectedGasFee, setSelectedGasFee] = useState<FeePreset>(
    FeePreset.Instant
  )
  const [displayFees, setDisplayFees] =
    useState<ReturnType<typeof calculateGasAndFees>>()

  const setCustomFee = useCallback(
    (gasLimit: number, gasPrice: BigNumber, modifier: FeePreset) => {
      setCustomGas({ gasLimit, gasPrice })
      setSelectedGasFee(modifier)
      setDisplayFees(
        calculateGasAndFees({
          gasPrice,
          gasLimit,
          tokenPrice,
          tokenDecimals: activeNetwork?.networkToken.decimals
        })
      )
    },
    [tokenPrice]
  )

  const setSpendLimit = useCallback(
    (customSpendData: SpendLimit) => {
      const srcTokenAddress: string =
        transaction?.displayValues?.tokenToBeApproved?.address
      const spenderAddress: string =
        transaction?.displayValues?.approveData.spender || '0'
      let limitAmount = ''

      if (customSpendData.limitType === Limit.UNLIMITED) {
        setCustomSpendLimit({
          ...customSpendData,
          value: undefined,
          default: bnToLocaleString(
            hexToBN(transaction?.displayValues.approveData.limit)
          )
        })
        limitAmount = ethers.constants.MaxUint256.toHexString()
        setDisplaySpendLimit(UNLIMITED_SPEND_LIMIT_LABEL)
      } else {
        setCustomSpendLimit(customSpendData)
        setDisplaySpendLimit(
          customSpendData.limitType === Limit.CUSTOM
            ? customSpendData.value?.amount || ''
            : bnToLocaleString(
                hexToBN(transaction?.displayValues.approveData.limit),
                transaction?.displayValues.tokenToBeApproved.decimals
              )
        )
      }
      const web3 = new Web3()
      const contract = new web3.eth.Contract(ERC20.abi as any, srcTokenAddress)

      const hashedCustomSpend =
        limitAmount &&
        contract.methods.approve(spenderAddress, limitAmount).encodeABI()
      // update transaction params data
      // data: hashedCustomSpend to networkService.signTransaction
    },
    [params, tokenPrice]
  )

  useEffect(() => {
    if (networkFees && transaction?.displayValues?.gasLimit && tokenPrice) {
      setDisplayFees(
        calculateGasAndFees({
          gasPrice:
            customGas?.gasPrice && customGas?.gasPrice
              ? customGas?.gasPrice
              : networkFees.low,
          gasLimit: customGas?.gasLimit ?? transaction.displayValues.gasLimit,
          tokenPrice,
          tokenDecimals: activeNetwork?.networkToken?.decimals
        })
      )
    }
  }, [transaction, networkFees, tokenPrice, customGas])

  useEffect(() => {
    async function loadTx() {
      const txDescription = await getTxInfo(
        params.to.toLocaleLowerCase(),
        params.data ?? '',
        params.value ?? '',
        activeNetwork
      )

      const decodedData = (txDescription as ethers.utils.TransactionDescription)
        .args
      const functionName =
        (txDescription as ethers.utils.TransactionDescription)?.name ??
        (txDescription as ethers.utils.TransactionDescription)?.functionFragment
          ?.name

      const parser = contractParserMap.get(functionName)

      if (params && isTxParams(params)) {
        if (!activeNetwork) return

        const displayValueProps: DisplayValueParserProps = {
          gasPrice: networkFees?.low || BigNumber.from(0),
          avaxPrice: tokenPrice || 0,
          avaxToken: activeNetwork?.networkToken,
          site: peerMeta
        }

        let gasLimit: number | null
        try {
          gasLimit = await (params?.gas
            ? BigNumber.from(params.gas).toNumber()
            : networkFeeService.estimateGasLimit(
                params.from,
                params.to,
                params.data ?? '',
                params.value ?? '',
                activeNetwork
              ))
        } catch (e) {
          // handle gas estimation errors with the correct error message
          if (e.error?.error) {
            throw e.error.error
          }
          throw e
        }

        const txParamsWithGasLimit = gasLimit
          ? { ...params, gas: gasLimit }
          : params

        const description = isTxDescriptionError(txDescription)
          ? txDescription
          : undefined

        const displayValues: TransactionDisplayValues = parser
          ? await parser(
              txParamsWithGasLimit,
              decodedData,
              displayValueProps,
              description
            )
          : parseDisplayValues(params, displayValueProps, description)

        const networkMetaData = activeNetwork
          ? {
              metamaskNetworkId: activeNetwork?.platformChainId,
              chainId: activeNetwork?.chainId
            }
          : {
              metamaskNetworkId: '',
              chainId: undefined
            }

        setTransaction({
          ...networkMetaData,
          txParams: txParamsWithGasLimit,
          displayValues,
          type: 'standard',
          transactionCategory: 'transfer'
        })
      }
    }
    loadTx()
  }, [tokenPrice])

  useEffect(() => {
    // Handle transaction Approval for REVOKING spend limit
    if (transaction?.displayValues?.tokenAmount === '0') {
      setDisplaySpendLimit('0')
    }
  }, [transaction])

  return useMemo(() => {
    return {
      ...transaction?.displayValues,
      ...(transaction?.txParams ? { txParams: transaction?.txParams } : {}),
      fees: displayFees,
      setCustomFee,
      setSpendLimit,
      displaySpendLimit,
      customSpendLimit,
      selectedGasFee,
      hash,
      showCustomSpendLimit,
      setShowCustomSpendLimit
    }
  }, [
    transaction,
    customGas,
    tokenPrice,
    setCustomFee,
    setSpendLimit,
    customSpendLimit,
    selectedGasFee
  ])
}
