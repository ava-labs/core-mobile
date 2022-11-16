import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DisplayValueParserProps,
  Transaction,
  TransactionDisplayValues
} from 'screens/rpc/util/types'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { BigNumber, ethers } from 'ethers'
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
import Logger from 'utils/Logger'
import { DappSignTransactionEvent } from 'contexts/DappConnectionContext/types'
import { useSelector } from 'react-redux'
import { NetworkTokenWithBalance, selectTokensWithBalance } from 'store/balance'
import { selectNetworkFee } from 'store/networkFee'
import { selectNetworks } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'
import { useFindToken } from 'contracts/contractParsers/utils/useFindToken'

const UNLIMITED_SPEND_LIMIT_LABEL = 'Unlimited'

export function useExplainTransaction(dappEvent: DappSignTransactionEvent) {
  const networkFees = useSelector(selectNetworkFee)
  const { nativeTokenPrice: tokenPrice } = useNativeTokenPrice()
  const activeNetwork = useActiveNetwork()
  const allNetworks = useSelector(selectNetworks)
  const avaxToken = (
    activeNetwork?.isTestnet
      ? allNetworks[ChainId.AVALANCHE_TESTNET_ID]
      : allNetworks[ChainId.AVALANCHE_MAINNET_ID]
  )?.networkToken
  const tokensWithBalance = useSelector(selectTokensWithBalance)
  const findToken = useFindToken()

  const [transaction, setTransaction] = useState<Transaction | null>(null)

  const txParams = (dappEvent.payload?.params || [])[0]
  const peerMeta = dappEvent.peerMeta
  const [customGas, setCustomGas] = useState<{
    gasLimit: number
    gasPrice: BigNumber
  } | null>(null)
  const [displaySpendLimit, setDisplaySpendLimit] = useState<string>(
    UNLIMITED_SPEND_LIMIT_LABEL
  )
  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    limitType: Limit.UNLIMITED
  })
  const [selectedGasFee, setSelectedGasFee] = useState<FeePreset>(
    FeePreset.Instant
  )

  const setCustomFee = useCallback(
    (gasPrice: BigNumber, modifier: FeePreset, gasLimit: number) => {
      setCustomGas({ gasLimit, gasPrice })
      setSelectedGasFee(modifier)
      const feeDisplayValues = calculateGasAndFees({
        gasPrice,
        gasLimit,
        tokenPrice,
        tokenDecimals: activeNetwork?.networkToken.decimals
      })

      // update transaction
      setTransaction(currentTransaction => {
        if (currentTransaction === null) return null

        const updatedTransaction = {
          ...currentTransaction,
          txParams: {
            ...currentTransaction.txParams,
            gasLimit: feeDisplayValues.gasLimit,
            gasPrice: feeDisplayValues.gasPrice.toHexString() // test this
          }
        }

        return updatedTransaction
      })
    },
    [tokenPrice, activeNetwork?.networkToken?.decimals]
  )

  const setSpendLimit = useCallback(
    (customSpendData: SpendLimit) => {
      if (transaction) {
        const srcTokenAddress: string =
          transaction.displayValues?.tokenToBeApproved?.address
        const spenderAddress: string =
          transaction.displayValues?.approveData.spender || '0'
        let limitAmount = ''

        if (customSpendData.limitType === Limit.UNLIMITED) {
          setCustomSpendLimit({
            ...customSpendData,
            value: undefined,
            default: bnToLocaleString(
              hexToBN(transaction.displayValues.approveData?.limit ?? '0')
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
                  hexToBN(transaction.displayValues.approveData?.limit ?? '0'),
                  transaction.displayValues.tokenToBeApproved.decimals
                )
          )
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
    [transaction]
  )

  /******************************************************************************
   * Load transaction information
   *****************************************************************************/
  useEffect(() => {
    async function loadTx() {
      // Get transaction description from ABIs
      const txDescription = await getTxInfo(
        txParams.to.toLocaleLowerCase(),
        txParams.data,
        txParams.value,
        activeNetwork
      )

      // Get decoded transaction data
      const decodedData = txDescription.args

      // Get function name. Try normalized name otherwise look into functionFragment
      const functionName =
        txDescription?.name ?? txDescription?.functionFragment?.name

      // Get parser based on function name
      const parser = contractParserMap.get(functionName)

      if (dappEvent.payload && txParams && isTxParams(txParams)) {
        // We need active network to continue
        if (!activeNetwork) {
          throw Error('no network')
        }

        // These are the default props we'll feed into the display parser later on
        // @ts-ignore
        const displayValueProps: DisplayValueParserProps = {
          gasPrice: networkFees?.low || BigNumber.from(0),
          avaxPrice: tokenPrice || 0, // prince in currency
          avaxToken: avaxToken as NetworkTokenWithBalance,
          erc20Tokens: tokensWithBalance ?? [],
          site: peerMeta
        }

        // some requests will have a missing gasLimit so we need to ensure it's there
        let gasLimit: number | null
        try {
          gasLimit = await (txParams?.gas
            ? BigNumber.from(txParams.gas).toNumber()
            : networkFeeService.estimateGasLimit(
                txParams.from,
                txParams.to,
                txParams.data,
                txParams.value,
                activeNetwork
              ))
        } catch (e) {
          // handle gas estimation errors with the correct error message
          Logger.error('error calculating limit', e)
          throw e
        }

        // create txParams that includes gasLimit
        const txParamsWithGasLimit = gasLimit
          ? { ...txParams, gas: gasLimit }
          : txParams

        // only include the description if it's free of errors
        const description = isTxDescriptionError(txDescription)
          ? undefined
          : txDescription

        // this is the simplified display values which
        // will be used to on the views.
        // uses a custom parser if there is one, otherwise
        // uses `parseDisplayValues` as a generic parser.
        const displayValues: TransactionDisplayValues = parser
          ? await parser(
              findToken,
              activeNetwork,
              txParamsWithGasLimit,
              decodedData,
              displayValueProps,
              description
            )
          : parseDisplayValues(
              activeNetwork,
              txParamsWithGasLimit,
              displayValueProps,
              description
            )

        // add metamask and chain id to transaction
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
          id: dappEvent.payload.id,
          method: dappEvent.payload.method,
          txParams: txParamsWithGasLimit,
          displayValues,
          ...networkMetaData
        })
      }
    }
    loadTx()
  }, [
    activeNetwork,
    avaxToken,
    dappEvent.payload,
    findToken,
    networkFees,
    peerMeta,
    tokenPrice,
    tokensWithBalance,
    txParams
  ])

  useEffect(() => {
    // Handle transaction Approval for REVOKING spend limit
    if (transaction?.displayValues?.tokenAmount === '0') {
      setDisplaySpendLimit('0')
    }
  }, [transaction])

  const feeDisplayValues = useMemo(() => {
    return (
      networkFees &&
      transaction?.displayValues.gasLimit &&
      calculateGasAndFees({
        gasPrice: customGas?.gasPrice ?? networkFees.low,
        gasLimit: customGas?.gasLimit ?? transaction.displayValues.gasLimit,
        tokenPrice,
        tokenDecimals: activeNetwork.networkToken.decimals
      })
    )
  }, [
    activeNetwork.networkToken.decimals,
    customGas?.gasLimit,
    customGas?.gasPrice,
    networkFees,
    tokenPrice,
    transaction?.displayValues.gasLimit
  ])

  const displayData: TransactionDisplayValues = useMemo(() => {
    const data = {
      ...transaction?.displayValues,
      ...(transaction?.txParams ? { txParams: transaction?.txParams } : {}),
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
    displaySpendLimit,
    customSpendLimit,
    selectedGasFee
  }
}
