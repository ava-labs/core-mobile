import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, ScrollView } from 'react-native'
import { AlertType, RpcMethod, TokenType } from '@avalabs/vm-module-types'
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
import { selectAccountByAddress } from 'store/account'
import Logger from 'utils/Logger'
import TokenAddress from 'components/TokenAddress'
import { humanize } from 'utils/string/humanize'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { isAddressApproved } from 'store/rpc/utils/isAddressApproved/isAddressApproved'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import { Banner } from 'components/Banner'
import GlobeSVG from 'components/svg/GlobeSVG'
import { useSpendLimits } from 'hooks/useSpendLimits'
import RpcRequestBottomSheet from '../shared/RpcRequestBottomSheet'
import BalanceChange from './BalanceChange'
import { SpendLimits } from './SpendLimits'
import MaliciousActivityWarning from './MaliciousActivityWarning'

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
  const chainId = signingData.chainId
  const network = getNetwork(chainId)
  const account = useSelector(selectAccountByAddress(signingData.account))

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

    const fromAddress = signingData.account
    const requestedAddress = `${request.chainId}:${fromAddress}`

    if (!isAddressApproved(requestedAddress, session.namespaces)) {
      rejectAndClose('Requested address is not authorized')
    }
  }, [rejectAndClose, request, signingData.account, signingData.type])

  const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
    useSpendLimits(displayData.tokenApprovals ?? [])

  const handleFeesChange = useCallback(
    (fees: Eip1559Fees<NetworkTokenUnit>) => {
      setMaxFeePerGas(fees.maxFeePerGas.toSubUnit())
      setMaxPriorityFeePerGas(fees.maxPriorityFeePerGas.toSubUnit())
    },
    []
  )

  if (showData && displayData.transactionDetails?.data) {
    const data = displayData.transactionDetails.data

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
      overrideData: hashedCustomSpend
    })
      .catch(Logger.error)
      .finally(() => {
        setSubmitting(false)
        goBack()
      })
  }

  const renderAlert = (): JSX.Element | null => {
    if (!displayData.alert) return null

    if (displayData.alert.type === AlertType.INFO) {
      return <Banner {...displayData.alert.details} />
    }

    return (
      <View sx={{ marginVertical: 12 }}>
        <MaliciousActivityWarning alert={displayData.alert} />
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
        defaultValue: spendLimit.tokenApproval.value,
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

  const renderMessageDetails = (): JSX.Element | null => {
    if (!displayData.messageDetails) return null

    return (
      <View>
        <Text variant="buttonMedium">Message:</Text>
        <View sx={styles.details}>
          <Text variant="body1">{displayData.messageDetails}</Text>
        </View>
      </View>
    )
  }
  const renderTransactionDetails = (): JSX.Element | null => {
    if (!displayData.transactionDetails) return null

    const isInternalRequest = isInAppRequest(request)

    const detailsToDisplay = []

    // loop through the transaction details
    // if the value is a string, display it
    // if the value is an address, display it as a token address
    for (const [key, value] of Object.entries(displayData.transactionDetails)) {
      if (
        key === 'data' || // skip data since we display it separately
        (key === 'website' && isInternalRequest) // skip website for internal requests
      )
        continue

      if (typeof value === 'string') {
        const isAddress = value.substring(0, 2) === '0x'

        detailsToDisplay.push(
          <Row style={{ justifyContent: 'space-between' }} key={key}>
            <Text variant="caption">{humanize(key)}</Text>
            {isAddress ? (
              <TokenAddress address={value} />
            ) : (
              <Text variant="buttonSmall">{value}</Text>
            )}
          </Row>
        )
      }
    }

    return (
      <>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="buttonMedium">Transaction Details</Text>
          {displayData.transactionDetails.data && (
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
          )}
        </Row>
        <View sx={styles.details}>{detailsToDisplay}</View>
      </>
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
            {renderMessageDetails()}
            {renderTransactionDetails()}
            {renderSpendLimits()}
            {renderBalanceChange()}
          </View>
          {showNetworkFeeSelector && (
            <NetworkFeeSelector
              chainId={chainId}
              gasLimit={
                signingData.data.gasLimit
                  ? Number(signingData.data.gasLimit)
                  : 0
              }
              onFeesChange={handleFeesChange}
            />
          )}
        </ScrollView>
        {renderDisclaimer()}
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
  },
  details: {
    justifyContent: 'space-between',
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '$neutral800'
  }
})

export default ApprovalPopup
