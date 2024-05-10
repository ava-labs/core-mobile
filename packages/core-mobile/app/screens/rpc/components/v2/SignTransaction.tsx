import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, ScrollView } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import { ApproveTransactionData, ContractCall } from 'screens/rpc/util/types'
import { useExplainTransactionV2 } from 'screens/rpc/hooks/useExplainTransactionV2'
import { ApproveTransaction } from 'screens/rpc/components/shared/signTransaction/ApproveTransaction'
import { AddLiquidityTransaction } from 'screens/rpc/components/shared/signTransaction/AddLiquidity'
import { GenericTransaction } from 'screens/rpc/components/shared/signTransaction/GenericTransaction'
import { SwapTransaction } from 'screens/rpc/components/shared/signTransaction/SwapTransaction'
import NetworkFeeSelector, { FeePreset } from 'components/NetworkFeeSelector'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import EditSpendLimit from 'components/EditSpendLimit'
import CarrotSVG from 'components/svg/CarrotSVG'
import FlexSpacer from 'components/FlexSpacer'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { RpcProvider } from 'store/rpc/types'
import { selectRequestStatus } from 'store/rpc/slice'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { hexToBN } from '@avalabs/utils-sdk'
import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { NetworkTokenUnit } from 'types'
import { Eip1559Fees } from 'utils/Utils'
import { isAddressApproved } from 'store/rpc/handlers/eth_sign/utils/isAddressApproved'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getChainIdFromRequest } from 'store/rpc/handlers/eth_sendTransaction/utils'
import RpcRequestBottomSheet from '../shared/RpcRequestBottomSheet'
import BalanceChange from '../shared/signTransaction/BalanceChange'
import TransactionWarning from './TransactionWarning'

const defaultErrMessage = 'Transaction failed'

type SignTransactionScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SignTransactionV2
>

const SignTransaction = (): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { goBack } = useNavigation<SignTransactionScreenProps['navigation']>()
  const {
    request,
    transaction: txParams,
    scanResponse
  } = useRoute<SignTransactionScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const { getNetwork } = useNetworks()
  const requestStatus = useSelector(selectRequestStatus(request.data.id))

  const chainId = getChainIdFromRequest(request)
  const network = getNetwork(chainId)

  const {
    theme: { colors }
  } = useTheme()
  const [submitting, setSubmitting] = useState(false)
  const [showData, setShowData] = useState(false)
  const [showCustomSpendLimit, setShowCustomSpendLimit] = useState(false)

  const rejectAndClose = useCallback(
    (message?: string) => {
      onReject(request, message)
      goBack()
    },
    [goBack, onReject, request]
  )

  const onFailedToLoadTransaction = useCallback(
    (error?: string) => {
      const message = defaultErrMessage + (error ? `: ${error}` : '')
      rejectAndClose(message)
    },
    [rejectAndClose]
  )

  const {
    contractType,
    selectedGasFee,
    setCustomFee,
    setSpendLimit,
    customSpendLimit,
    transaction,
    displayData
  } = useExplainTransactionV2(request, txParams, onFailedToLoadTransaction)

  const requestedApprovalLimit = displayData.approveData
    ? hexToBN(displayData.approveData.limit)
    : undefined

  // TODO #1: moved useExplainTransactionV2 hook logic to redux
  // TODO #2: move isAddressApproved validation logic to eth_sendTransaction handler
  useEffect(() => {
    if (request.provider !== RpcProvider.WALLET_CONNECT) return

    // for wallet connect, we need to make sure the requested address is authorized
    const session = WalletConnectService.getSession(request.data.topic)

    if (!session) {
      rejectAndClose('Session not found')
      return
    }

    const fromAddress = transaction?.txParams?.from

    if (fromAddress) {
      const requestedAddress = `${request.data.params.chainId}:${transaction.txParams.from}`

      if (!isAddressApproved(requestedAddress, session.namespaces)) {
        rejectAndClose('Requested address is not authorized')
      }
    }
  }, [
    chainId,
    rejectAndClose,
    request.data.params.chainId,
    transaction?.txParams.from,
    request.provider,
    request.data.topic
  ])

  useEffect(() => {
    if (!requestStatus) return

    const txHash = requestStatus?.result?.txHash
    const error = requestStatus.error

    if (txHash || error) {
      setSubmitting(false)
      goBack()
    }
  }, [goBack, requestStatus])

  const handleFeesChange = useCallback(
    (fees: Eip1559Fees<NetworkTokenUnit>, feePreset: FeePreset) => {
      setCustomFee(fees, feePreset)
    },
    [setCustomFee]
  )

  const renderNetwork = (): JSX.Element | undefined => {
    if (!network) return

    return (
      <View style={txStyles.fullWidthContainer}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body2">Network:</Text>
          <Row style={{ alignItems: 'center' }}>
            <NetworkLogo
              key={network.chainId.toString()}
              logoUri={network.logoUri}
              size={24}
              style={{ marginRight: 8 }}
            />
            <Text variant="buttonMedium">{network.chainName}</Text>
          </Row>
        </Row>
        <Space y={16} />
      </View>
    )
  }

  if (showData) {
    return (
      <RpcRequestBottomSheet onClose={() => rejectAndClose()}>
        <View style={{ padding: 16 }}>
          <Row style={{ alignItems: 'center' }}>
            <AvaButton.Base onPress={() => setShowData(false)}>
              <CarrotSVG direction={'left'} size={23} />
            </AvaButton.Base>
            <Space x={14} />
            <Text variant="heading4">Transaction Data</Text>
          </Row>
          <Space y={16} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="body1">Hex Data:</Text>
            <Text variant="body1">
              {getHexStringToBytes(displayData?.txParams?.data)} Bytes
            </Text>
          </Row>
          <View style={{ paddingVertical: 14 }}>
            <Text
              variant="body1"
              sx={{
                padding: 16,
                backgroundColor: '$neutral800',
                borderRadius: 15
              }}>
              {displayData?.txParams?.data}
            </Text>
          </View>
        </View>
      </RpcRequestBottomSheet>
    )
  }

  if (showCustomSpendLimit) {
    return (
      <RpcRequestBottomSheet onClose={() => rejectAndClose()}>
        <EditSpendLimit
          site={displayData.site}
          spendLimit={customSpendLimit}
          token={displayData?.tokenToBeApproved}
          onClose={() => setShowCustomSpendLimit(false)}
          setSpendLimit={setSpendLimit}
          requestedApprovalLimit={requestedApprovalLimit}
        />
      </RpcRequestBottomSheet>
    )
  }

  const onHandleApprove = (): void => {
    if (transaction) {
      setSubmitting(true)
      onApprove(request, { txParams: transaction.txParams })
    }
  }

  const txTitle = (): string => {
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

  const renderTransactionInfo = (): JSX.Element => {
    return (
      <>
        {(contractType === ContractCall.APPROVE && (
          <ApproveTransaction
            {...(displayData as ApproveTransactionData)}
            onCustomFeeSet={setCustomFee}
            selectedGasFee={selectedGasFee}
            setShowCustomSpendLimit={setShowCustomSpendLimit}
            setShowTxData={setShowData}
            customSpendLimit={customSpendLimit}
          />
        )) ||
          ((contractType === ContractCall.ADD_LIQUIDITY ||
            contractType === ContractCall.ADD_LIQUIDITY_AVAX) && (
            <AddLiquidityTransaction {...displayData} />
          )) ||
          (contractType === ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS && (
            <SwapTransaction {...displayData} />
          )) ||
          ((contractType === ContractCall.UNKNOWN ||
            contractType === undefined) && (
            <GenericTransaction {...displayData} />
          ))}
      </>
    )
  }

  const renderApproveRejectButtons = (): JSX.Element => {
    return (
      <>
        <FlexSpacer />
        <View>
          <Button
            testID="approve_button"
            size="xlarge"
            type="primary"
            onPress={onHandleApprove}
            disabled={submitting || !displayData?.maxFeePerGas}>
            {submitting && <ActivityIndicator />} Approve
          </Button>
          <Space y={16} />
          <Button
            size="xlarge"
            type="secondary"
            disabled={submitting}
            onPress={() => rejectAndClose()}>
            Reject
          </Button>
        </View>
      </>
    )
  }

  const validationResultType = scanResponse?.validation?.result_type

  return (
    <>
      <RpcRequestBottomSheet
        onClose={() => {
          rejectAndClose()
        }}>
        <ScrollView contentContainerStyle={txStyles.scrollView}>
          <View>
            <Text variant="heading4">{txTitle()}</Text>
            <Space y={8} />
            {(validationResultType === 'Malicious' ||
              validationResultType === 'Warning') && (
              <>
                <Space y={32} />
                <TransactionWarning type={validationResultType} />
              </>
            )}
            <Space y={16} />
            {renderNetwork()}
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="body2">Transaction Details</Text>
              <AvaButton.Base onPress={() => setShowData(true)}>
                <Row>
                  <CarrotSVG
                    color={colors.$neutral50}
                    direction={'left'}
                    size={12}
                  />
                  <CarrotSVG color={colors.$neutral50} size={12} />
                </Row>
              </AvaButton.Base>
            </Row>
            {!displayData?.maxFeePerGas ? (
              <View>
                <ActivityIndicator size={'large'} />
              </View>
            ) : (
              renderTransactionInfo()
            )}
            <BalanceChange
              displayData={displayData}
              transactionSimulation={
                scanResponse?.simulation?.status === 'Success'
                  ? scanResponse?.simulation
                  : undefined
              }
            />
          </View>
          {displayData?.maxFeePerGas && (
            <NetworkFeeSelector
              chainId={chainId}
              gasLimit={displayData?.gasLimit ?? 0}
              onFeesChange={handleFeesChange}
            />
          )}
          {renderApproveRejectButtons()}
        </ScrollView>
      </RpcRequestBottomSheet>
      {isSeedlessSigningBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Signing is currently under maintenance. Service will resume shortly.'
          }
        />
      )}
    </>
  )
}

export const txStyles = StyleSheet.create({
  scrollView: {
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 24,
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
  },
  fullWidthContainer: {
    width: '100%'
  }
})

export default SignTransaction
