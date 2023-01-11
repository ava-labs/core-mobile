import AvaText from 'components/AvaText'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import {
  AddLiquidityDisplayData,
  ApproveTransactionData,
  ContractCall,
  SwapExactTokensForTokenDisplayValues,
  Transaction,
  TransactionDisplayValues
} from 'screens/rpc/util/types'
import { useExplainTransaction } from 'screens/rpc/util/useExplainTransaction'
import { ApproveTransaction } from 'screens/rpc/components/Transactions/ApproveTransaction'
import { AddLiquidityTransaction } from 'screens/rpc/components/Transactions/AddLiquidity'
import { GenericTransaction } from 'screens/rpc/components/Transactions/GenericTransaction'
import NetworkFeeSelector, { FeePreset } from 'components/NetworkFeeSelector'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useApplicationContext } from 'contexts/ApplicationContext'
import EditSpendLimit from 'components/EditSpendLimit'
import CarrotSVG from 'components/svg/CarrotSVG'
import { getExplorerAddressByNetwork } from 'utils/ExplorerUtils'
import useInAppBrowser from 'hooks/useInAppBrowser'
import FlexSpacer from 'components/FlexSpacer'
import { Popable } from 'react-native-popable'
import { SwapTransaction } from 'screens/rpc/components/Transactions/SwapTransaction'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { PopableContent } from 'components/PopableContent'
import { PopableLabel } from 'components/PopableLabel'
import { BigNumber } from 'ethers'
import { ScrollView } from 'react-native-gesture-handler'
import { EthSendTransactionRpcRequest } from 'store/walletConnect/handlers/eth_sendTransaction'
import { TransactionError } from 'services/network/types'

const defaultErrMessage = 'Transaction Failed'

interface Props {
  onReject: (request: EthSendTransactionRpcRequest, message?: string) => void
  onApprove: (request: EthSendTransactionRpcRequest, data: Transaction) => void
  dappEvent: EthSendTransactionRpcRequest
  onClose: (request: EthSendTransactionRpcRequest) => void
}

const SignTransaction: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const { openUrl } = useInAppBrowser()
  const theme = useApplicationContext().theme
  const activeNetwork = useActiveNetwork()
  const [txFailedError, setTxFailedError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [showData, setShowData] = useState(false)
  const [showCustomSpendLimit, setShowCustomSpendLimit] = useState(false)

  const onFailedToLoadTransaction = useCallback((error?: string) => {
    const message = defaultErrMessage + (error ? `: ${error}` : '')
    setTxFailedError(message)
  }, [])

  const {
    contractType,
    selectedGasFee,
    setCustomFee,
    setSpendLimit,
    customSpendLimit,
    transaction,
    displayData
  } = useExplainTransaction(dappEvent, onFailedToLoadTransaction)

  useEffect(() => {
    if (dappEvent.error || dappEvent.result) {
      setSubmitting(false)
    }

    if (!dappEvent.error) {
      return
    }

    // in case the TX was sent to the blockchain but was rejected
    if ((dappEvent?.error as TransactionError).transactionHash) {
      setTxFailedError('Transaction Rejected')
    } else {
      // in case we have some error
      setTxFailedError(defaultErrMessage)
    }
  }, [dappEvent])

  useEffect(() => {
    if (txFailedError) {
      showSnackBarCustom({
        component: (
          <TransactionToast
            type={TransactionToastType.ERROR}
            message={txFailedError}
          />
        ),
        duration: 'long'
      })
      onReject(dappEvent)
      onClose(dappEvent)
    }
  }, [dappEvent, onClose, onReject, txFailedError])

  const explorerUrl =
    activeNetwork &&
    dappEvent.result &&
    getExplorerAddressByNetwork(activeNetwork, dappEvent.result)

  const handleGasPriceChange = useCallback(
    (gasPrice: BigNumber, feePreset: FeePreset) => {
      setCustomFee(gasPrice, feePreset, displayData?.gasLimit ?? 0)
    },
    [displayData?.gasLimit, setCustomFee]
  )

  const handleGasLimitChange = useCallback(
    (customGasLimit: number) => {
      setCustomFee(
        displayData?.gasPrice ?? BigNumber.from(0),
        selectedGasFee,
        customGasLimit
      )
    },
    [displayData?.gasPrice, selectedGasFee, setCustomFee]
  )

  const netFeeInfoMessage = (
    <PopableContent
      message={`Gas limit: ${displayData?.gasLimit} \nGas price: ${displayData?.fee} nAVAX`}
    />
  )

  if (showData) {
    return (
      <View style={{ padding: 16 }}>
        <Row style={{ alignItems: 'center' }}>
          <AvaButton.Base onPress={() => setShowData(false)}>
            <CarrotSVG direction={'left'} size={23} />
          </AvaButton.Base>
          <Space x={14} />
          <AvaText.Heading1>Transaction Data</AvaText.Heading1>
        </Row>
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body1>Hex Data:</AvaText.Body1>
          <AvaText.Body1>
            {getHexStringToBytes(displayData?.txParams?.data)} Bytes
          </AvaText.Body1>
        </Row>
        <View style={{ paddingVertical: 14 }}>
          <AvaText.Body1
            textStyle={{
              padding: 16,
              backgroundColor: theme.colorBg3,
              borderRadius: 15
            }}>
            {displayData?.txParams?.data}
          </AvaText.Body1>
        </View>
      </View>
    )
  }

  if (showCustomSpendLimit) {
    return (
      <EditSpendLimit
        site={displayData?.site}
        spendLimit={customSpendLimit}
        token={displayData?.tokenToBeApproved}
        onClose={() => setShowCustomSpendLimit(!showCustomSpendLimit)}
        setSpendLimit={setSpendLimit}
      />
    )
  }

  async function onHandleApprove() {
    if (transaction) {
      setSubmitting(true)
      setTxFailedError(undefined)
      onApprove(dappEvent, transaction)
    }
  }

  function txTitle() {
    switch (contractType) {
      case ContractCall.APPROVE:
        return 'Token Spend Approval'
      case ContractCall.ADD_LIQUIDITY:
      case ContractCall.ADD_LIQUIDITY_AVAX:
        return 'Add Liquidity to pool'
      case ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS:
        return 'Approve Swap'
      default:
        return 'Approve Transaction'
    }
  }

  return (
    <ScrollView contentContainerStyle={txStyles.scrollView}>
      <View>
        <AvaText.Heading1>{txTitle()}</AvaText.Heading1>
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AvaText.Body2 color={theme.colorText1}>
            Approve {dappEvent.payload.peerMeta?.name} transaction
          </AvaText.Body2>
          <AvaButton.Base onPress={() => setShowData(true)}>
            <Row>
              <CarrotSVG
                color={theme.colorText1}
                direction={'left'}
                size={12}
              />
              <CarrotSVG color={theme.colorText1} size={12} />
            </Row>
          </AvaButton.Base>
        </Row>
        {!displayData?.gasPrice ? (
          <View>
            <ActivityIndicator size={'large'} />
          </View>
        ) : (
          <>
            {(contractType === ContractCall.APPROVE && (
              <ApproveTransaction
                {...(displayData as ApproveTransactionData)}
                hash={dappEvent.result}
                onCustomFeeSet={setCustomFee}
                selectedGasFee={selectedGasFee}
                setShowCustomSpendLimit={setShowCustomSpendLimit}
                setShowTxData={setShowData}
              />
            )) ||
              ((contractType === ContractCall.ADD_LIQUIDITY ||
                contractType === ContractCall.ADD_LIQUIDITY_AVAX) && (
                <AddLiquidityTransaction
                  {...(displayData as AddLiquidityDisplayData)}
                  hash={dappEvent.result}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                  setShowTxData={setShowData}
                />
              )) ||
              (contractType === ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS && (
                <SwapTransaction
                  {...(displayData as SwapExactTokensForTokenDisplayValues)}
                  hash={dappEvent.result}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                  setShowTxData={setShowData}
                />
              )) ||
              ((contractType === ContractCall.UNKNOWN ||
                contractType === undefined) && (
                <GenericTransaction
                  {...(displayData as TransactionDisplayValues)}
                  hash={dappEvent.result}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                  setShowTxData={setShowData}
                />
              ))}
          </>
        )}
      </View>
      {!dappEvent.result && displayData?.gasPrice && (
        <NetworkFeeSelector
          gasLimit={displayData?.gasLimit ?? 0}
          onGasPriceChange={handleGasPriceChange}
          onGasLimitChange={handleGasLimitChange}
        />
      )}
      {dappEvent.result ? (
        <>
          <Space y={16} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Popable
              content={netFeeInfoMessage}
              position={'right'}
              style={{ minWidth: 200 }}
              backgroundColor={theme.colorBg3}>
              <PopableLabel
                label="Network Fee"
                textStyle={{ lineHeight: 24, color: theme.white }}
              />
            </Popable>
            <View
              style={{
                alignItems: 'flex-end'
              }}>
              <AvaText.Heading3>{displayData.fee} AVAX</AvaText.Heading3>
              <AvaText.Body3 currency>
                {displayData.feeInCurrency}
              </AvaText.Body3>
            </View>
          </Row>
          <Space y={16} />
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body2 color={theme.colorText1}>
              Transaction hash
            </AvaText.Body2>
            <TokenAddress address={dappEvent.result} copyIconEnd />
          </Row>
          <Space y={24} />
          <View
            style={{
              paddingVertical: 16,
              paddingHorizontal: 24
            }}>
            <AvaButton.SecondaryLarge
              onPress={() => explorerUrl && openUrl(explorerUrl)}>
              View on Explorer
            </AvaButton.SecondaryLarge>
            <Space y={20} />
            <AvaButton.SecondaryLarge
              style={{ marginBottom: 32 }}
              onPress={() => onClose(dappEvent)}>
              Close
            </AvaButton.SecondaryLarge>
          </View>
        </>
      ) : (
        <>
          <FlexSpacer />
          <View
            style={{
              paddingVertical: 16,
              paddingHorizontal: 24
            }}>
            <AvaButton.PrimaryLarge
              onPress={onHandleApprove}
              disabled={submitting || !displayData?.gasPrice}>
              {submitting && <ActivityIndicator />} Approve
            </AvaButton.PrimaryLarge>
            <Space y={20} />
            <AvaButton.SecondaryLarge
              onPress={() => {
                onReject(dappEvent)
                onClose(dappEvent)
              }}>
              Reject
            </AvaButton.SecondaryLarge>
          </View>
        </>
      )}
    </ScrollView>
  )
}

export const txStyles = StyleSheet.create({
  scrollView: {
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 70,
    flexGrow: 1
  },
  info: {
    justifyContent: 'space-between',
    marginTop: 8,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  },
  balance: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    padding: 16
  },
  arrow: {
    width: '100%',
    marginStart: 8,
    paddingVertical: 10
  }
})
export default SignTransaction
