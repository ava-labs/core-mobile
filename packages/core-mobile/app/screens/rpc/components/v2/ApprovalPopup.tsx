import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, ScrollView } from 'react-native'
import { TokenType } from '@avalabs/vm-module-types'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { Eip1559Fees } from 'utils/Utils'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { useNetworks } from 'hooks/networks/useNetworks'
import {
  selectAccountByAddress,
  selectAccountByIndex,
  selectActiveAccount
} from 'store/account/slice'
import TokenAddress from 'components/TokenAddress'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { isAccountApproved } from 'store/rpc/utils/isAccountApproved/isAccountApproved'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import GlobeSVG from 'components/svg/GlobeSVG'
import { useSpendLimits } from 'hooks/useSpendLimits'
import { isHex } from 'viem'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import Logger from 'utils/Logger'
import { SendErrorMessage } from 'screens/send/utils/types'
import { useNativeTokenWithBalance } from 'screens/send/hooks/useNativeTokenWithBalance'
import { validateFee } from 'screens/send/utils/evm/validate'
import { useGasless } from 'hooks/useGasless'
import RpcRequestBottomSheet from '../shared/RpcRequestBottomSheet'
import { DetailSectionView } from '../shared/DetailSectionView'
import BalanceChange from './BalanceChange'
import { SpendLimits } from './SpendLimits'
import AlertBanner from './AlertBanner'
import NetworkFeeSelectorWithGasless from './NetworkFeeSelectorWithGasless'

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
  const [amountError, setAmountError] = useState<string | undefined>()
  const nativeToken = useNativeTokenWithBalance()

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
  const {
    gaslessEnabled,
    setGaslessEnabled,
    showGaslessSwitch,
    gaslessError,
    handleGaslessTx
  } = useGasless({
    signingData,
    maxFeePerGas,
    caip2ChainId
  })
  const approveDisabled =
    !network ||
    !account ||
    (displayData.networkFeeSelector && maxFeePerGas === undefined) ||
    (displayData.networkFeeSelector && maxPriorityFeePerGas === undefined) ||
    submitting ||
    amountError !== undefined

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

  const validateEthSendTransaction = useCallback(() => {
    if (
      !signingData ||
      !network?.networkToken ||
      !nativeToken ||
      signingData.type !== 'eth_sendTransaction'
    )
      return
    const ethSendTx = signingData.data

    try {
      const gasLimit = ethSendTx.gasLimit ? BigInt(ethSendTx.gasLimit) : 0n
      const amount = ethSendTx.value ? BigInt(ethSendTx.value) : 0n

      validateFee({
        gasLimit,
        maxFee: maxFeePerGas || 0n,
        amount,
        nativeToken,
        token: nativeToken
      })

      setAmountError(undefined)
    } catch (err) {
      if (err instanceof Error) {
        setAmountError(err.message)
      } else {
        setAmountError(SendErrorMessage.UNKNOWN_ERROR)
      }
    }
  }, [signingData, network, maxFeePerGas, nativeToken])

  useEffect(() => {
    if (gaslessEnabled) {
      setAmountError(undefined)
      return
    }
    validateEthSendTransaction()
  }, [validateEthSendTransaction, gaslessEnabled])

  const handleFeesChange = useCallback((fees: Eip1559Fees) => {
    setMaxFeePerGas(fees.maxFeePerGas)
    setMaxPriorityFeePerGas(fees.maxPriorityFeePerGas)
  }, [])

  const onHandleApprove = async (): Promise<void> => {
    if (approveDisabled) return
    setSubmitting(true)

    if (showGaslessSwitch && gaslessEnabled) {
      const txHash = await handleGaslessTx(account.addressC)
      if (!txHash) {
        setSubmitting(false)
        return
      }
    }

    try {
      await onApprove({
        network,
        account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        overrideData: hashedCustomSpend
      })
      goBack()
    } catch (error: unknown) {
      Logger.error('Error approving transaction', error)
    } finally {
      setSubmitting(false)
    }
  }

  const renderAlert = (): JSX.Element | null => {
    if (!displayData.alert) return null

    return (
      <View sx={{ marginVertical: 12 }}>
        <AlertBanner alert={displayData.alert} />
      </View>
    )
  }

  const renderGaslessAlert = (): JSX.Element | null => {
    if (!gaslessError) return null
    return (
      <View sx={{ marginVertical: 12 }}>
        <AlertBanner
          alert={gaslessError}
          customStyle={{
            borderColor: '$dangerLight',
            backgroundColor: '$transparent',
            iconColor: colors.$white
          }}
        />
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
          testID={
            approveDisabled ? 'disabled_approve_button' : 'approve_button'
          }
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

  const renderAmountError = (): JSX.Element | null => {
    if (!amountError) return null

    return (
      <Text
        variant="body2"
        sx={{
          color: '$dangerMain',
          maxWidth: '55%',
          marginVertical: 8
        }}>
        {amountError}
      </Text>
    )
  }

  const renderNetworkFeeSelectorWithGasless = (): JSX.Element | null => {
    if (!showNetworkFeeSelector) return null

    let gasLimit: number | undefined

    if (
      typeof signingData.data === 'object' &&
      'gasLimit' in signingData.data
    ) {
      gasLimit = Number(signingData.data.gasLimit || 0)
    }

    return (
      <NetworkFeeSelectorWithGasless
        gaslessEnabled={gaslessEnabled}
        setGaslessEnabled={setGaslessEnabled}
        gasLimit={gasLimit}
        caip2ChainId={caip2ChainId}
        handleFeesChange={handleFeesChange}
        showGaslessSwitch={showGaslessSwitch}
      />
    )
  }

  return (
    <>
      <RpcRequestBottomSheet
        onClose={() => {
          rejectAndClose()
        }}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          testID="approve_popup_scroll_view">
          <Text variant="heading4">{displayData.title}</Text>
          <Space y={12} />
          {renderAlert()}
          {renderGaslessAlert()}
          <Space y={12} />
          {renderDappInfo()}
          {renderNetwork()}
          {renderAccount()}
          {renderDetails()}
          {renderSpendLimits()}
          {renderBalanceChange()}
          {renderAmountError()}
          {renderNetworkFeeSelectorWithGasless()}
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
