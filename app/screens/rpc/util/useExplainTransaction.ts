import { useCallback, useEffect, useMemo, useState } from 'react'
import { RpcTxParams, Transaction } from 'screens/rpc/util/types'
import { GasPrice, useGasPrice } from 'utils/GasPriceHook'
import { Limit, SpendLimit } from 'components/EditFees'
import { web3 } from '@avalabs/avalanche-wallet-sdk'
// @ts-ignore javascript
import ERC20_ABI from 'human-standard-token-abi'
import { getTxInfo } from 'screens/rpc/util/getTransactionInfo'
import { calculateGasAndFees, Fees } from 'utils/calculateGasAndFees'
import { GasFeeModifier } from 'components/CustomFees'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import networkFeeService from 'services/networkFee/NetworkFeeService'
import { bnToEthersBigNumber, stringToBN } from '@avalabs/utils-sdk'
import { useSelector } from 'react-redux'
import { selectTokenById } from 'store/balance'

const UNLIMITED_SPEND_LIMIT_LABEL = 'Unlimited'

export function useExplainTransaction(txParams: RpcTxParams) {
  const avaxGasPrice = useGasPrice().gasPrice
  const avaxToken = useSelector(selectTokenById('avax'))
  const avaxPrice = avaxToken?.priceUSD ?? 0
  const activeNetwork = useActiveNetwork()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [defaultGasPrice, setDefaultGasPrice] = useState<GasPrice | null>(null)
  const [feeDisplayValues, setFeeDisplayValues] = useState<Fees>()
  const [customGas, setCustomGas] = useState<{
    gasLimit: string
    gasPrice: GasPrice
  } | null>(null)
  const [showCustomSpendLimit, setShowCustomSpendLimit] =
    useState<boolean>(false)
  const [displaySpendLimit, setDisplaySpendLimit] = useState<string>(
    UNLIMITED_SPEND_LIMIT_LABEL
  )
  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    limitType: Limit.DEFAULT
  })
  const [selectedGasFee, setSelectedGasFee] = useState<GasFeeModifier>(
    GasFeeModifier.INSTANT
  )

  const setCustomFee = useCallback(
    (gasLimit: string, gasPrice: GasPrice, modifier: GasFeeModifier) => {
      setCustomGas({ gasLimit, gasPrice })
      setSelectedGasFee(modifier)

      setFeeDisplayValues(
        calculateGasAndFees(gasPrice, gasLimit, avaxPrice ?? 0)
      )
    },
    [avaxPrice]
  )

  const setSpendLimit = useCallback(
    (customSpendData: SpendLimit) => {
      const srcToken: string = transaction?.displayValues?.token.address
      const spenderAddress: string = transaction?.displayValues?.spender || '0'
      let limitAmount = ''

      if (customSpendData.limitType === Limit.UNLIMITED) {
        setCustomSpendLimit({
          ...customSpendData,
          value: undefined
        })
        limitAmount = transaction?.displayValues?.tokenAmount || '0'
      }

      if (customSpendData.limitType === Limit.CUSTOM && customSpendData.value) {
        limitAmount = transaction?.displayValues?.tokenAmount || '0'
      }

      const contract = new web3.eth.Contract(ERC20_ABI as any, srcToken)

      // udpate data?
      const hashedCustomSpend =
        limitAmount &&
        contract.methods.approve(spenderAddress, limitAmount).encodeABI()
      console.log('encoded ABI hash', hashedCustomSpend)
    },
    [txParams, avaxGasPrice]
  )

  useEffect(() => {
    if (defaultGasPrice && transaction?.displayValues?.gasLimit && avaxPrice) {
      setFeeDisplayValues(
        calculateGasAndFees(
          customGas?.gasPrice &&
            customGas?.gasPrice?.value !== '' &&
            customGas?.gasPrice?.value !== '0'
            ? customGas?.gasPrice
            : defaultGasPrice,
          customGas?.gasLimit ?? transaction.displayValues.gasLimit.toString(),
          avaxPrice
        )
      )
    }
  }, [transaction, defaultGasPrice, avaxGasPrice, customGas])

  useEffect(() => {
    ;(async () => {
      if (txParams && avaxPrice && avaxGasPrice) {
        try {
          const txExplanation = await getTxInfo(
            txParams,
            !activeNetwork.isTestnet
          )
          const displayTxData = {
            ...txExplanation.data,
            ...calculateGasAndFees(
              avaxGasPrice,
              txParams.gas as string,
              avaxPrice
            ),
            fromAddress: txParams.from,
            toAddress: txParams.to,
            site: {}
          }

          setDefaultGasPrice(displayTxData?.gasPrice)

          // todo: check network fee service
          const gasLimit = await (txParams.gas
            ? Promise.resolve(false)
            : networkFeeService?.estimateGasLimit(
                txParams.from,
                txParams.to,
                txParams.data ?? '',
                bnToEthersBigNumber(stringToBN(txParams.value ?? '0', 9)),
                activeNetwork
              ))

          const txParamsWithGasLimit = gasLimit
            ? { gas: `${gasLimit}`, ...txParams }
            : txParams

          setTransaction({
            id: Date.now().toString(),
            time: Date.now(),
            metamaskNetworkId: '0',
            chainId: '43113',
            txParams: txParamsWithGasLimit,
            type: 'standard',
            transactionCategory: 'tranfer',
            displayValues: displayTxData
          })
        } catch (e) {
          console.error(e)
        }
      }
    })()
  }, [avaxGasPrice])

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
      fees: feeDisplayValues,
      setCustomFee,
      showCustomSpendLimit,
      setShowCustomSpendLimit,
      setSpendLimit,
      displaySpendLimit,
      customSpendLimit,
      selectedGasFee
    }
  }, [
    defaultGasPrice,
    transaction,
    customGas,
    avaxPrice,
    setCustomFee,
    showCustomSpendLimit,
    setSpendLimit,
    displaySpendLimit,
    customSpendLimit,
    selectedGasFee,
    feeDisplayValues
  ])
}
