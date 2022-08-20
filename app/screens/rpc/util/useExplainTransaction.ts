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
import { DappEvent } from 'contexts/DappConnectionContext'
import { useSelector } from 'react-redux'
import { NetworkTokenWithBalance, selectTokensWithBalance } from 'store/balance'
import { selectNetworkFee } from 'store/networkFee'
import { selectNetworks } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'

const UNLIMITED_SPEND_LIMIT_LABEL = 'Unlimited'

export function useExplainTransaction(dappEvent?: DappEvent) {
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

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const txParams = (dappEvent?.payload?.params || [])[0]
  const peerMeta = dappEvent?.peerMeta
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
    (gasLimit: number, gasPrice: BigNumber, modifier: FeePreset) => {
      setCustomGas({ gasLimit, gasPrice })
      setSelectedGasFee(modifier)
      const feeDisplayValues = calculateGasAndFees({
        gasPrice,
        gasLimit,
        tokenPrice,
        tokenDecimals: activeNetwork?.networkToken.decimals
      })

      if (transaction) {
        const updatedTransaction = {
          ...transaction,
          txParams: {
            ...transaction.txParams,
            gasLimit: feeDisplayValues.gasLimit,
            gasPrice: feeDisplayValues.gasPrice.toHexString() // test this
          }
        }
        // update transaction
        setTransaction(updatedTransaction)
      }
    },
    [tokenPrice, transaction, activeNetwork?.networkToken?.decimals]
  )

  useEffect(() => {
    if (customSpendLimit.limitType === Limit.UNLIMITED && transaction) {
      setCustomSpendLimit({
        ...customSpendLimit,
        value: undefined,
        default: bnToLocaleString(
          hexToBN(transaction.displayValues.approveData?.limit ?? '0')
        )
      })
    }
  }, [transaction, customSpendLimit])

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
          ERC20.abi as any,
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
      const decodedData = (txDescription as ethers.utils.TransactionDescription)
        .args

      // Get function name. Try normalized name otherwise look into functionFragment
      const functionName =
        (txDescription as ethers.utils.TransactionDescription)?.name ??
        (txDescription as ethers.utils.TransactionDescription)?.functionFragment
          ?.name

      // Get parser based on function name
      const parser = contractParserMap.get(functionName)

      if (dappEvent && dappEvent.payload && txParams && isTxParams(txParams)) {
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
    tokenPrice,
    activeNetwork,
    avaxToken,
    dappEvent,
    networkFees,
    peerMeta,
    tokensWithBalance,
    txParams
  ])

  useEffect(() => {
    // Handle transaction Approval for REVOKING spend limit
    if (transaction?.displayValues?.tokenAmount === '0') {
      setDisplaySpendLimit('0')
    }
  }, [transaction])

  return useMemo(() => {
    const feeDisplayValues =
      networkFees &&
      transaction?.displayValues.gasLimit &&
      calculateGasAndFees({
        gasPrice: customGas?.gasPrice ?? networkFees.low,
        gasLimit: customGas?.gasLimit ?? transaction.displayValues.gasLimit,
        tokenPrice,
        tokenDecimals: activeNetwork.networkToken.decimals
      })
    return {
      ...transaction?.displayValues,
      ...(transaction?.txParams ? { txParams: transaction?.txParams } : {}),
      ...feeDisplayValues,
      transaction,
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
    customSpendLimit,
    selectedGasFee,
    displaySpendLimit,
    networkFees,
    activeNetwork.networkToken.decimals
  ])
}
