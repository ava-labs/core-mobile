import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, ScrollView } from 'react-native'
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
import { isAddressApproved } from 'store/rpc/handlers/eth_sign/utils/isAddressApproved'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectAccountByAddress } from 'store/account'
import Logger from 'utils/Logger'
import TokenAddress from 'components/TokenAddress'
import { humanize } from 'utils/string/humanize'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import RpcRequestBottomSheet from '../shared/RpcRequestBottomSheet'
import MaliciousActivityWarning from './MaliciousActivityWarning'

type ApprovalPopupScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.ApprovalPopup
>

const ApprovalPopup = (): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { goBack } = useNavigation<ApprovalPopupScreenProps['navigation']>()
  const { request, displayData, signingData, onApprove, onReject } =
    useRoute<ApprovalPopupScreenProps['route']>().params
  const { getNetwork } = useNetworks()
  const caip2ChainId = displayData.chain.chainId
  const chainId = Number(caip2ChainId.split(':')[1])
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
    !network || !account || !maxFeePerGas || !maxPriorityFeePerGas || submitting

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
      maxPriorityFeePerGas
    })
      .catch(Logger.error)
      .finally(() => {
        setSubmitting(false)
        goBack()
      })
  }

  const renderNetwork = (): JSX.Element | undefined => {
    if (!network) return

    return (
      <View style={styles.fullWidthContainer}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="buttonMedium">Network:</Text>
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
        <View
          sx={{
            justifyContent: 'space-between',
            marginTop: 8,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            backgroundColor: '$neutral800',
            gap: 8
          }}>
          {detailsToDisplay}
        </View>
      </>
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
            <MaliciousActivityWarning
              style={{ marginTop: 12, marginBottom: 12 }}
              result={displayData.transactionValidation?.resultType}
              title={displayData.transactionValidation?.title ?? ''}
              subTitle={displayData.transactionValidation?.description ?? ''}
            />
            <Space y={12} />
            {renderNetwork()}
            {renderTransactionDetails()}
            {/* TODO re-add transaction simulation 
             https://ava-labs.atlassian.net/browse/CP-8870
            <BalanceChange
              displayData={displayData}
              transactionSimulation={
                scanResponse?.simulation?.status === 'Success'
                  ? scanResponse?.simulation
                  : undefined
              }
            /> */}
          </View>
          {displayData.networkFeeSelector &&
            signingData.type === 'transaction' && (
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
