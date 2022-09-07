import AvaText from 'components/AvaText'
import React, { FC, useState } from 'react'
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
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useApplicationContext } from 'contexts/ApplicationContext'
import EditSpendLimit from 'components/EditSpendLimit'
import CarrotSVG from 'components/svg/CarrotSVG'
import { DappEvent } from 'contexts/DappConnectionContext'
import { getExplorerAddressByNetwork } from 'utils/ExplorerUtils'
import useInAppBrowser from 'hooks/useInAppBrowser'
import FlexSpacer from 'components/FlexSpacer'
import { Popable } from 'react-native-popable'
import { SwapTransaction } from 'screens/rpc/components/Transactions/SwapTransaction'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast from 'components/toast/TransactionToast'
import * as Sentry from '@sentry/react-native'
import { PopableContent } from 'components/PopableContent'
import { PopableLabel } from 'components/PopableLabel'

interface Props {
  onApprove: (tx: Transaction) => Promise<{ hash?: string; error?: unknown }>
  onReject: () => void
  dappEvent?: DappEvent
  onClose: () => void
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
  const [hash, setHash] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [showData, setShowData] = useState(false)
  const [showCustomSpendLimit, setShowCustomSpendLimit] = useState(false)
  const {
    contractType,
    selectedGasFee,
    setCustomFee,
    setSpendLimit,
    customSpendLimit,
    transaction,
    ...rest
  } = useExplainTransaction(dappEvent)
  const explorerUrl =
    activeNetwork && hash && getExplorerAddressByNetwork(activeNetwork, hash)
  const displayData = {
    ...rest
  } as TransactionDisplayValues

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
      onApprove(transaction)
        .then(result => {
          if (result?.hash) {
            setHash(result.hash)
            setSubmitting(false)
          }
        })
        .catch(reason => {
          setSubmitting(false)
          if (reason?.error?.transactionHash) {
            showSnackBarCustom({
              component: (
                <TransactionToast
                  message={'Transaction failed'}
                  txHash={reason?.error?.transactionHash}
                />
              ),
              duration: 'long'
            })
            onClose()
          } else {
            setTxFailedError(`there was an error processing the transaction`)
          }
          Sentry?.captureException(reason, {
            tags: { dapps: 'signTransaction' }
          })
        })
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
    <BottomSheetScrollView
      style={{
        flex: 1,
        paddingTop: 16,
        paddingHorizontal: 14
      }}>
      <View>
        <AvaText.Heading1>{txTitle()}</AvaText.Heading1>
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AvaText.Body2 color={theme.colorText1}>
            Approve {dappEvent?.peerMeta?.name} transaction
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
                hash={hash}
                error={txFailedError}
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
                  hash={hash}
                  error={txFailedError}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                  setShowTxData={setShowData}
                />
              )) ||
              (contractType === ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS && (
                <SwapTransaction
                  {...(displayData as SwapExactTokensForTokenDisplayValues)}
                  hash={hash}
                  error={txFailedError}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                  setShowTxData={setShowData}
                />
              )) ||
              ((contractType === ContractCall.UNKNOWN ||
                contractType === undefined) && (
                <GenericTransaction
                  {...(displayData as TransactionDisplayValues)}
                  hash={hash}
                  error={txFailedError}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                  setShowTxData={setShowData}
                />
              ))}
          </>
        )}
      </View>
      {!hash && displayData?.gasPrice && (
        <NetworkFeeSelector
          gasLimit={displayData?.gasLimit ?? 0}
          onChange={setCustomFee}
        />
      )}
      {hash ? (
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
            <TokenAddress address={hash} copyIconEnd />
          </Row>
          <Space y={24} />
          <View
            style={{
              paddingVertical: 16,
              paddingHorizontal: 24
            }}>
            <AvaButton.SecondaryLarge
              style={{ marginBottom: 32 }}
              onPress={() => explorerUrl && openUrl(explorerUrl)}>
              View on Explorer
            </AvaButton.SecondaryLarge>
            <Space y={20} />
            <AvaButton.SecondaryLarge
              style={{ marginBottom: 32 }}
              onPress={onClose}>
              Close
            </AvaButton.SecondaryLarge>
          </View>
        </>
      ) : (
        <>
          <FlexSpacer />
          {!!txFailedError && (
            <AvaText.Body1 color={theme.colorError}>
              {txFailedError}
            </AvaText.Body1>
          )}
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
            <AvaButton.SecondaryLarge onPress={onReject}>
              Reject
            </AvaButton.SecondaryLarge>
          </View>
        </>
      )}
    </BottomSheetScrollView>
  )
}

export const txStyles = StyleSheet.create({
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
