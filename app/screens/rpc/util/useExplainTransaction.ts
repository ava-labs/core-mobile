import { useCallback, useEffect, useMemo, useState } from 'react'
import { RpcTxParams, Transaction } from 'screens/rpc/util/types'
// @ts-ignore javascript
import { getTxInfo } from 'screens/rpc/util/getTransactionInfo'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { bnToLocaleString, hexToBN } from '@avalabs/utils-sdk'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { BigNumber, ethers } from 'ethers'
import { FeePreset } from 'components/NetworkFeeSelector'
import { calculateGasAndFees } from 'utils/Utils'
import Web3 from 'web3'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'

const UNLIMITED_SPEND_LIMIT_LABEL = 'Unlimited'

export enum Limit {
  DEFAULT = 'DEFAULT',
  UNLIMITED = 'UNLIMITED',
  CUSTOM = 'CUSTOM'
}

export interface SpendLimit {
  limitType: Limit
  value?: {
    bn: any
    amount: string
  }
}

export function useExplainTransaction(txParams: RpcTxParams) {
  const tokenPrice = useNativeTokenPrice().nativeTokenPrice
  const { networkFee } = useNetworkFee()
  const activeNetwork = useActiveNetwork()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [feeDisplayValues, setFeeDisplayValues] =
    useState<ReturnType<typeof calculateGasAndFees>>()
  const [customGas, setCustomGas] = useState<{
    gasLimit: number
    gasPrice: BigNumber
  } | null>(null)
  const [displaySpendLimit, setDisplaySpendLimit] = useState<string>(
    UNLIMITED_SPEND_LIMIT_LABEL
  )
  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    limitType: Limit.DEFAULT
  })
  const [selectedGasFee, setSelectedGasFee] = useState<FeePreset>(
    FeePreset.Instant
  )

  const setCustomFee = useCallback(
    (gasLimit: number, gasPrice: BigNumber, modifier: FeePreset) => {
      setCustomGas({ gasLimit, gasPrice })
      setSelectedGasFee(modifier)
      const displayFees = calculateGasAndFees({
        gasPrice,
        gasLimit,
        tokenPrice: tokenPrice,
        tokenDecimals: activeNetwork?.networkToken.decimals
      })
      setFeeDisplayValues(displayFees)
    },
    [tokenPrice]
  )

  const setSpendLimit = useCallback(
    (customSpendData: SpendLimit) => {
      const srcTokenAddress: string = transaction?.displayValues?.token.address
      const spenderAddress: string =
        transaction?.displayValues?.approveData.spender || '0'
      let limitAmount = ''

      if (customSpendData.limitType === Limit.UNLIMITED) {
        setCustomSpendLimit({
          ...customSpendData,
          value: undefined
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
        limitAmount =
          customSpendData.limitType === Limit.CUSTOM
            ? customSpendData.value?.bn.toString()
            : transaction?.displayValues?.approveData?.limit
      }
      // import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json';
      const web3 = new Web3()
      const contract = new web3.eth.Contract(ERC20.abi as any, srcTokenAddress)

      const hashedCustomSpend =
        limitAmount &&
        contract.methods.approve(spenderAddress, limitAmount).encodeABI()

      // data: hashedCustomSpend to networkService.signTransaction
    },
    [txParams, tokenPrice]
  )

  // useEffect(() => {
  //   if (defaultGasPrice && transaction?.displayValues?.gasLimit && avaxPrice) {
  //     setFeeDisplayValues(
  //       calculateGasAndFees(
  //         customGas?.gasPrice &&
  //           customGas?.gasPrice?.value !== '' &&
  //           customGas?.gasPrice?.value !== '0'
  //           ? customGas?.gasPrice
  //           : defaultGasPrice,
  //         customGas?.gasLimit ?? transaction.displayValues.gasLimit.toString(),
  //         avaxPrice
  //       )
  //     )
  //   }
  // }, [transaction, defaultGasPrice, avaxGasPrice, customGas])

  useEffect(() => {
    ;(async () => {
      if (txParams && tokenPrice && customGas) {
        try {
          const txExplanation = await getTxInfo(
            txParams,
            !activeNetwork.isTestnet
          )
          const displayTxData = {
            ...txExplanation.data,
            ...calculateGasAndFees({
              gasPrice: customGas.gasPrice,
              gasLimit: Number(txParams.gas),
              tokenPrice,
              tokenDecimals: activeNetwork?.networkToken.decimals
            }),
            fromAddress: txParams.from,
            toAddress: txParams.to,
            site: {}
          }

          // setDefaultGasPrice(displayTxData?.gasPrice)

          // todo: check network fee service
          // const gasLimit = await (txParams.gas
          //   ? Promise.resolve(false)
          //   : networkFeeService?.estimateGasLimit(
          //       txParams.from,
          //       txParams.to,
          //       txParams.data ?? '',
          //       bnToEthersBigNumber(stringToBN(txParams.value ?? '0', 9)),
          //       activeNetwork
          //     ))
          //
          // const txParamsWithGasLimit = gasLimit
          //   ? { gas: `${gasLimit}`, ...txParams }
          //   : txParams

          // setTransaction({
          //   id: Date.now().toString(),
          //   time: Date.now(),
          //   metamaskNetworkId: '0',
          //   chainId: '43113',
          //   txParams: txParamsWithGasLimit,
          //   type: 'standard',
          //   transactionCategory: 'tranfer',
          //   displayValues: displayTxData
          // })
        } catch (e) {
          console.error(e)
        }
      }
    })()
  }, [tokenPrice])

  // useEffect(() => {
  //   // Handle transaction Approval for REVOKING spend limit
  //   if (transaction?.displayValues?.tokenAmount === '0') {
  //     setDisplaySpendLimit('0')
  //   }
  // }, [transaction])

  return useMemo(() => {
    return {
      ...transaction?.displayValues,
      ...(transaction?.txParams ? { txParams: transaction?.txParams } : {}),
      fees: feeDisplayValues,
      setCustomFee,
      setSpendLimit,
      displaySpendLimit,
      customSpendLimit,
      selectedGasFee
    }
  }, [
    transaction,
    customGas,
    tokenPrice,
    setCustomFee,
    setSpendLimit,
    displaySpendLimit,
    customSpendLimit,
    selectedGasFee,
    feeDisplayValues
  ])
}
