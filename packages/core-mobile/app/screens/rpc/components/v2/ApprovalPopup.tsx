import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, ScrollView } from 'react-native'
import { TokenType } from '@avalabs/vm-module-types'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
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
import RpcRequestBottomSheet from '../shared/RpcRequestBottomSheet'
import { DetailSectionView } from '../shared/DetailSectionView'
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

  const {
    theme: { colors }
  } = useTheme()
  const [submitting, setSubmitting] = useState(false)
  const [maxFeePerGas, setMaxFeePerGas] = useState<bigint | undefined>()
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<
    bigint | undefined
  >()

  const approveDisabled =
    !network ||
    !account ||
    (displayData.networkFeeSelector && maxFeePerGas === undefined) ||
    (displayData.networkFeeSelector && maxPriorityFeePerGas === undefined) ||
    submitting

  const showNetworkFeeSelector = displayData.networkFeeSelector

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

  const filteredSections = useMemo(() => {
    return displayData.details.map(detailSection => {
      if (detailSection.title !== 'Transaction Details') {
        return detailSection
      }

      const filteredItems = detailSection.items.filter(item => {
        if (typeof item === 'string') return true

        const isDataOrInAppWebsite =
          item.label === 'Website' && isInAppRequest(request)

        return !isDataOrInAppWebsite
      })

      return { ...detailSection, items: filteredItems }
    })
  }, [displayData.details, request])

  const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
    useSpendLimits(displayData.tokenApprovals)

  const handleFeesChange = useCallback(
    (fees: Eip1559Fees<NetworkTokenUnit>) => {
      setMaxFeePerGas(fees.maxFeePerGas.toSubUnit())
      setMaxPriorityFeePerGas(fees.maxPriorityFeePerGas.toSubUnit())
    },
    []
  )

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

  const handlePressDataItem = (data: string): void => {
    navigate(AppNavigation.Modal.TransactionData, {
      data,
      onClose: goBack
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
          testID={approveDisabled ? "disabled_approve_button" : "approve_button"}
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

  const renderNetworkFeeSelector = (): JSX.Element | null => {
    if (!showNetworkFeeSelector || !chainId) return null

    let gasLimit: number | undefined

    if (
      typeof signingData.data === 'object' &&
      'gasLimit' in signingData.data
    ) {
      gasLimit = Number(signingData.data.gasLimit || 0)
    }

    if (!gasLimit) return null

    return (
      <NetworkFeeSelector
        chainId={chainId}
        gasLimit={gasLimit}
        onFeesChange={handleFeesChange}
      />
    )
  }

  const renderDetails = (): JSX.Element => {
    return (
      <>
        {filteredSections.map((detailSection, index) => (
          <DetailSectionView
            key={index}
            detailSection={detailSection}
            onPressDataItem={handlePressDataItem}
          />
        ))}
      </>
    )
  }

  return (
    <>
      <RpcRequestBottomSheet
        onClose={() => {
          rejectAndClose()
        }}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text variant="heading4">{displayData.title}</Text>
          <Space y={12} />
          {renderAlert()}
          <Space y={12} />
          {renderDappInfo()}
          {renderNetwork()}
          {renderAccount()}
          {renderDetails()}
          {renderSpendLimits()}
          {renderBalanceChange()}
          {renderNetworkFeeSelector()}
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
