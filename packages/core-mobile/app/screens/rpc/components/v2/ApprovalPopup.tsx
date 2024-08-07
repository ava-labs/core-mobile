/* eslint-disable sonarjs/cognitive-complexity */
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, ScrollView } from 'react-native'
import {
  DisplayData,
  ExportImportTxDetails,
  RpcMethod,
  TokenType,
  TransactionDetails
} from '@avalabs/vm-module-types'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import CarrotSVG from 'components/svg/CarrotSVG'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { NetworkTokenUnit } from 'types'
import { Eip1559Fees } from 'utils/Utils'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { useNetworks } from 'hooks/networks/useNetworks'
import {
  selectAccountByAddress,
  selectAccountByIndex,
  selectActiveAccount
} from 'store/account/slice'
import Logger from 'utils/Logger'
import TokenAddress from 'components/TokenAddress'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { isAccountApproved } from 'store/rpc/utils/isAccountApproved/isAccountApproved'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import GlobeSVG from 'components/svg/GlobeSVG'
import { useSpendLimits } from 'hooks/useSpendLimits'
import { isHex } from 'viem'
import { getChainIdFromCaip2 } from 'temp/caip2ChainIds'
import { isExportImportTxDetails } from '@avalabs/avalanche-module'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import RpcRequestBottomSheet from '../shared/RpcRequestBottomSheet'
import { MessageDetails } from '../shared/MessageDetails'
import { TransactionDetailsView } from '../shared/TransactionDetailsView'
import { StakingDetailsView } from '../shared/AvalancheSendTransaction/components/StakingDetailsView'
import { TxFee } from '../shared/AvalancheSendTransaction/components/TxFee'
import { ExportImportTxDetailsView } from '../shared/AvalancheSendTransaction/components/ExportImportTxDetailsView'
import { BaseTxView } from '../shared/AvalancheSendTransaction/components/BaseTxView'
import { CreateChainTxView } from '../shared/AvalancheSendTransaction/components/CreateChainTxView'
import { CreateSubnetTxView } from '../shared/AvalancheSendTransaction/components/CreateSubnetTxView'
import BalanceChange from './BalanceChange'
import { SpendLimits } from './SpendLimits'
import AlertBanner from './AlertBanner'

type ApprovalPopupScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.ApprovalPopup
>

const ApprovalPopup = (): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { goBack, navigate } =
    useNavigation<ApprovalPopupScreenProps['navigation']>()
  const { request, displayData, signingData, onApprove, onReject } =
    useRoute<ApprovalPopupScreenProps['route']>().params
  const { getNetwork } = useNetworks()
  const caip2ChainId = request.chainId
  const chainId = getChainIdFromCaip2(caip2ChainId)
  const network = getNetwork(chainId)
  const accountSelector =
    'account' in signingData
      ? selectAccountByAddress(signingData.account)
      : 'accountIndex' in signingData && signingData.accountIndex
      ? selectAccountByIndex(signingData.accountIndex)
      : selectActiveAccount

  const account = useSelector(accountSelector)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const {
    theme: { colors }
  } = useTheme()
  const [submitting, setSubmitting] = useState(false)
  const [showData, setShowData] = useState(false)
  const [maxFeePerGas, setMaxFeePerGas] = useState<bigint | undefined>()
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<
    bigint | undefined
  >()

  const approveDisabled =
    !network ||
    !account ||
    (displayData.networkFeeSelector && !maxFeePerGas) ||
    (displayData.networkFeeSelector && !maxPriorityFeePerGas) ||
    submitting

  const showNetworkFeeSelector =
    displayData.networkFeeSelector &&
    signingData.type === RpcMethod.ETH_SEND_TRANSACTION

  const rejectAndClose = useCallback(
    (message?: string) => {
      onReject(message)
      goBack()
    },
    [goBack, onReject]
  )

  useEffect(() => {
    if (isInAppRequest(request)) return

    // for requests via wallet connect, we need to make sure the requested address is authorized
    const session = WalletConnectService.getSession(request.sessionId)

    if (!session) {
      rejectAndClose('Session not found')
      return
    }

    if (
      !account ||
      !isAccountApproved(account, request.chainId, session.namespaces)
    ) {
      rejectAndClose('Requested address is not authorized')
    }
  }, [rejectAndClose, request, account])

  const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
    useSpendLimits(displayData.tokenApprovals)

  const handleFeesChange = useCallback(
    (fees: Eip1559Fees<NetworkTokenUnit>) => {
      setMaxFeePerGas(fees.maxFeePerGas.toSubUnit())
      setMaxPriorityFeePerGas(fees.maxPriorityFeePerGas.toSubUnit())
    },
    []
  )

  const transactionDetailsData =
    displayData.transactionDetails && 'data' in displayData.transactionDetails
      ? displayData.transactionDetails.data
      : undefined

  if (showData && transactionDetailsData) {
    const data = transactionDetailsData
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
            <Text variant="body1">{getHexStringToBytes(data)} Bytes</Text>
          </Row>
          <View style={{ paddingVertical: 14 }}>
            <Text
              variant="body1"
              sx={{
                padding: 16,
                backgroundColor: '$neutral800',
                borderRadius: 15
              }}>
              {data}
            </Text>
          </View>
        </View>
      </RpcRequestBottomSheet>
    )
  }

  const onHandleApprove = async (): Promise<void> => {
    if (approveDisabled) return

    setSubmitting(true)

    onApprove({
      network,
      account,
      maxFeePerGas,
      maxPriorityFeePerGas,
      overrideData: hashedCustomSpend,
      isTestnet: isDeveloperMode
    })
      .catch(Logger.error)
      .finally(() => {
        setSubmitting(false)
        goBack()
      })
  }

  const renderAlert = (): JSX.Element | null => {
    if (!displayData.alert) return null

    return (
      <View sx={{ marginVertical: 12 }}>
        <AlertBanner alert={displayData.alert} />
      </View>
    )
  }

  const renderDappInfo = (): JSX.Element | null => {
    if (!displayData.dAppInfo) return null

    const { name, action, logoUri } = displayData.dAppInfo

    return (
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <OvalTagBg
          style={{
            height: 65,
            width: 65,
            backgroundColor: colors.$neutral800
          }}>
          {logoUri ? (
            <Avatar.Basic
              title={name}
              logoUri={logoUri}
              size={48}
              backgroundColor={colors.$neutral600}
            />
          ) : (
            <GlobeSVG height={'100%'} />
          )}
        </OvalTagBg>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 10,
            marginBottom: 16
          }}>
          <Text variant="caption" style={{ textAlign: 'center' }}>
            {action}
          </Text>
        </View>
      </View>
    )
  }

  const renderNetwork = (): JSX.Element | null => {
    if (!displayData.network) return null

    const { name, logoUri } = displayData.network

    return (
      <View style={styles.fullWidthContainer}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="buttonMedium">Network:</Text>
          <Row style={{ alignItems: 'center' }}>
            <NetworkLogo
              logoUri={logoUri}
              size={24}
              style={{ marginRight: 8 }}
            />
            <Text variant="buttonMedium">{name}</Text>
          </Row>
        </Row>
        <Space y={16} />
      </View>
    )
  }

  const handleEditSpendLimit = (): void => {
    const spendLimit = spendLimits[0]

    if (
      !updateSpendLimit ||
      !spendLimit ||
      !spendLimit.tokenApproval.value ||
      spendLimit.tokenApproval.token.type !== TokenType.ERC20
    )
      return

    navigate(AppNavigation.Modal.EditSpendLimit, {
      spendLimit,
      onClose: goBack,
      updateSpendLimit,
      dAppName: request.dappInfo.name,
      editingToken: {
        defaultValue: isHex(spendLimit.tokenApproval.value)
          ? spendLimit.tokenApproval.value
          : '0x',
        decimals: spendLimit.tokenApproval.token.decimals
      }
    })
  }

  const renderAccount = (): JSX.Element | null => {
    if (!displayData.account) return null

    return (
      <View style={styles.fullWidthContainer}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="buttonMedium">Account:</Text>
          <TokenAddress address={displayData.account} textType="ButtonMedium" />
        </Row>
        <Space y={16} />
      </View>
    )
  }

  const renderDisclaimer = (): JSX.Element | null => {
    if (!displayData.disclaimer) return null
    return (
      <View sx={{ marginHorizontal: 16 }}>
        <Text
          sx={{ color: '$warningMain', textAlign: 'center' }}
          variant="body2">
          {displayData.disclaimer}
        </Text>
      </View>
    )
  }

  const renderApproveRejectButtons = (): JSX.Element => {
    return (
      <View sx={{ padding: 16 }}>
        <Button
          testID="approve_button"
          size="xlarge"
          type="primary"
          onPress={onHandleApprove}
          disabled={approveDisabled}>
          {submitting && <ActivityIndicator />} Approve
        </Button>
        <Space y={16} />
        <Button
          testID="reject_button"
          size="xlarge"
          type="secondary"
          disabled={submitting}
          onPress={() => rejectAndClose()}>
          Reject
        </Button>
      </View>
    )
  }

  const balanceChange = displayData.balanceChange
  const hasBalanceChange =
    balanceChange &&
    (balanceChange.ins.length > 0 || balanceChange.outs.length > 0)

  const renderSpendLimits = (): JSX.Element | null => {
    if (spendLimits.length === 0 || hasBalanceChange) {
      return null
    }
    return (
      <SpendLimits
        spendLimits={spendLimits}
        onEdit={canEdit ? handleEditSpendLimit : undefined}
      />
    )
  }

  const renderBalanceChange = (): JSX.Element | null => {
    if (!hasBalanceChange) return null

    return <BalanceChange balanceChange={balanceChange} />
  }

  const renderNetworkFee = (): JSX.Element | null => {
    if (showNetworkFeeSelector && chainId) {
      return (
        <NetworkFeeSelector
          chainId={chainId}
          gasLimit={
            signingData.data.gasLimit ? Number(signingData.data.gasLimit) : 0
          }
          onFeesChange={handleFeesChange}
        />
      )
    }

    let txFee =
      displayData.stakingDetails?.txFee ??
      displayData.chainDetails?.txFee ??
      displayData.blockchainDetails?.txFee ??
      displayData.subnetDetails?.txFee
    if (
      displayData.transactionDetails &&
      'txFee' in displayData.transactionDetails &&
      displayData.transactionDetails.txFee !== undefined
    ) {
      txFee = displayData.transactionDetails.txFee
    }
    if (!showNetworkFeeSelector && txFee) {
      return <TxFee txFee={txFee} backgroundColor={colors.$neutral800} />
    }
    return null
  }

  const renderTransactionDetails = (
    details: TransactionDetails | ExportImportTxDetails
  ): JSX.Element => {
    if (isExportImportTxDetails(details)) {
      return <ExportImportTxDetailsView details={details} />
    }
    return (
      <TransactionDetailsView
        details={details}
        request={request}
        setShowData={setShowData}
      />
    )
  }

  const renderDetails = (data: DisplayData): JSX.Element | null => {
    if (data.transactionDetails) {
      return renderTransactionDetails(data.transactionDetails)
    }
    if (data.stakingDetails) {
      return <StakingDetailsView details={data.stakingDetails} />
    }
    if (data.chainDetails) {
      return <BaseTxView tx={data.chainDetails} />
    }
    if (data.blockchainDetails) {
      return <CreateChainTxView tx={data.blockchainDetails} />
    }
    if (data.subnetDetails) {
      return <CreateSubnetTxView tx={data.subnetDetails} />
    }
    return null
  }

  return (
    <>
      <RpcRequestBottomSheet
        onClose={() => {
          rejectAndClose()
        }}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View>
            <Text variant="heading4">{displayData.title}</Text>
            <Space y={12} />
            {renderAlert()}
            <Space y={12} />
            {renderDappInfo()}
            {renderNetwork()}
            {renderAccount()}
            {displayData.messageDetails && (
              <MessageDetails details={displayData.messageDetails} />
            )}
            {renderDetails(displayData)}
            {renderSpendLimits()}
            {renderBalanceChange()}
          </View>
          {renderNetworkFee()}
          {renderDisclaimer()}
        </ScrollView>
        {renderApproveRejectButtons()}
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

export const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 24,
    flexGrow: 1
  },
  fullWidthContainer: {
    width: '100%'
  }
})

export default ApprovalPopup
