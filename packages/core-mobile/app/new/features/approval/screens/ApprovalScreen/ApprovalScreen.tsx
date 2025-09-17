import { Separator, showAlert, Text, View } from '@avalabs/k2-alpine'
import { RpcMethod } from '@avalabs/vm-module-types'
import { NetworkTokenSymbols } from 'common/components/TokenIcon'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { validateFee } from 'common/hooks/send/utils/evm/validate'
import { SendErrorMessage } from 'common/hooks/send/utils/types'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { L2_NETWORK_SYMBOL_MAPPING } from 'consts/chainIdsWithIncorrectSymbol'
import { router } from 'expo-router'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useGasless } from 'hooks/useGasless'
import { useSpendLimits } from 'hooks/useSpendLimits'
import { ActionSheet } from 'new/common/components/ActionSheet'
import { TokenLogo } from 'new/common/components/TokenLogo'
import { Warning } from 'new/common/components/Warning'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Keyboard, Platform } from 'react-native'
import { useSelector } from 'react-redux'
import { ApprovalParams } from 'services/walletconnectv2/walletConnectCache/types'
import {
  selectAccountByAddress,
  selectAccountByIndex,
  selectActiveAccount
} from 'store/account/slice'
import { selectIsSeedlessSigningBlocked } from 'store/posthog/slice'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import Logger from 'utils/Logger'
import { Eip1559Fees } from 'utils/Utils'
import { Account } from '../../components/Account'
import BalanceChange from '../../components/BalanceChange/BalanceChange'
import { Details } from '../../components/Details'
import { Network } from '../../components/Network'
import { NetworkFeeSelectorWithGasless } from '../../components/NetworkFeeSelectorWithGasless'
import { SpendLimits } from '../../components/SpendLimits/SpendLimits'
import { overrideContractItem, removeWebsiteItemIfNecessary } from './utils'

const ApprovalScreen = ({
  params: { request, displayData, signingData, onApprove, onReject }
}: {
  params: ApprovalParams
}): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { getNetwork } = useNetworks()
  const caip2ChainId = request.chainId
  const chainId = getChainIdFromCaip2(caip2ChainId)
  const network = getNetwork(chainId)
  const [amountError, setAmountError] = useState<string | undefined>()
  const nativeToken = useNativeTokenWithBalanceByNetwork(network)
  const activeWallet = useActiveWallet()

  const symbol = chainId
    ? (L2_NETWORK_SYMBOL_MAPPING[chainId] as NetworkTokenSymbols)
    : undefined

  const accountSelector =
    'account' in signingData
      ? selectAccountByAddress(signingData.account)
      : 'accountIndex' in signingData && signingData.accountIndex
      ? selectAccountByIndex(activeWallet.id, signingData.accountIndex)
      : selectActiveAccount

  const account = useSelector(accountSelector)

  const [submitting, setSubmitting] = useState(false)
  const [maxFeePerGas, setMaxFeePerGas] = useState<bigint | undefined>()
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<
    bigint | undefined
  >()
  const {
    gaslessEnabled,
    setGaslessEnabled,
    shouldShowGaslessSwitch,
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

  const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
    useSpendLimits(displayData.tokenApprovals)

  const filteredSections = useMemo(() => {
    return displayData.details.map(detailSection => {
      if (detailSection.title !== 'Transaction Details') {
        return detailSection
      }

      const filteredItems = detailSection.items
        .filter(item => removeWebsiteItemIfNecessary(item, request))
        .map(item => overrideContractItem(item, request))

      return { ...detailSection, items: filteredItems }
    })
  }, [displayData.details, request])

  const balanceChange = displayData.balanceChange
  const hasBalanceChange =
    balanceChange &&
    (balanceChange.ins.length > 0 || balanceChange.outs.length > 0)

  const rejectAndClose = useCallback(
    (message?: string) => {
      onReject(message)
      router.canGoBack() && router.back()
    },
    [onReject]
  )

  const handleApprove = useCallback(async (): Promise<void> => {
    if (approveDisabled) return
    setSubmitting(true)

    if (shouldShowGaslessSwitch && gaslessEnabled) {
      const txHash = await handleGaslessTx(account.addressC)
      if (!txHash) {
        setSubmitting(false)
        return
      }
    }

    try {
      await onApprove({
        walletId: activeWallet.id,
        walletType: activeWallet.type,
        network,
        account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        overrideData: hashedCustomSpend
      })
      router.canGoBack() && router.back()
    } catch (error: unknown) {
      Logger.error('Error approving transaction', error)
    } finally {
      setSubmitting(false)
    }
  }, [
    approveDisabled,
    shouldShowGaslessSwitch,
    gaslessEnabled,
    handleGaslessTx,
    account,
    onApprove,
    activeWallet.id,
    activeWallet.type,
    network,
    maxFeePerGas,
    maxPriorityFeePerGas,
    hashedCustomSpend
  ])

  const validateEthSendTransaction = useCallback(() => {
    if (
      !signingData ||
      !network?.networkToken ||
      !nativeToken ||
      signingData.type !== RpcMethod.ETH_SEND_TRANSACTION
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

  const handleFeesChange = useCallback((fees: Eip1559Fees) => {
    setMaxFeePerGas(fees.maxFeePerGas)
    setMaxPriorityFeePerGas(fees.maxPriorityFeePerGas)
  }, [])

  useEffect(() => {
    if (isSeedlessSigningBlocked) {
      showAlert({
        title: 'Signing Temporarily Unavailable',
        description:
          'Signing is currently under maintenance.\n\nPlease try again shortly.',
        buttons: [
          {
            text: 'Got it',
            onPress: rejectAndClose
          }
        ]
      })
    }
  }, [isSeedlessSigningBlocked, rejectAndClose])

  useEffect(() => {
    if (gaslessEnabled) {
      setAmountError(undefined)
      return
    }
    validateEthSendTransaction()
  }, [validateEthSendTransaction, gaslessEnabled])

  useEffect(() => {
    // (Android) native screens need to dismiss the keyboard when the screen is focused
    if (Platform.OS === 'android' && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }
  }, [])

  const renderGaslessAlert = useCallback((): JSX.Element | null => {
    if (gaslessError === null || gaslessError.length === 0) return null

    return (
      <Warning
        message={gaslessError}
        sx={{ marginBottom: 12, marginRight: 16 }}
      />
    )
  }, [gaslessError])

  const renderDappInfo = useCallback(
    (dAppInfo: {
      name: string
      action: string
      logoUri?: string
    }): JSX.Element | null => {
      const { action, logoUri } = dAppInfo

      return (
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 36
          }}>
          <TokenLogo logoUri={logoUri} symbol={symbol} size={62} />
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 21
            }}>
            <Text
              variant="body1"
              sx={{
                textAlign: 'center',
                fontSize: 15,
                lineHeight: 20,
                fontWeight: '500',
                color: '$textPrimary'
              }}>
              {action}
            </Text>
          </View>
        </View>
      )
    },
    [symbol]
  )

  const renderDappInfoOrTitle = useCallback((): JSX.Element | null => {
    // prioritize rendering dAppInfo over title if both are present
    // we only want to render one of them
    if (displayData.dAppInfo) return renderDappInfo(displayData.dAppInfo)

    return null
  }, [displayData.dAppInfo, renderDappInfo])

  const renderAccountAndNetwork = useCallback((): JSX.Element | undefined => {
    if (displayData.account && displayData.network) {
      return (
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12
          }}>
          <Account address={displayData.account} />
          <Separator sx={{ marginHorizontal: 16 }} />
          <Network
            logoUri={displayData.network.logoUri}
            symbol={symbol}
            name={displayData.network.name}
          />
        </View>
      )
    }

    if (displayData.network) {
      return (
        <Network
          logoUri={displayData.network.logoUri}
          symbol={symbol}
          name={displayData.network.name}
        />
      )
    }

    if (displayData.account) {
      return <Account address={displayData.account} />
    }
  }, [displayData.account, displayData.network, symbol])

  const renderDetails = useCallback((): JSX.Element => {
    return (
      <View>
        {filteredSections.map((detailSection, index) => (
          <Details key={index} detailSection={detailSection} symbol={symbol} />
        ))}
      </View>
    )
  }, [filteredSections, symbol])

  const renderBalanceChange = useCallback((): JSX.Element | null => {
    if (!hasBalanceChange) return null

    return <BalanceChange balanceChange={balanceChange} />
  }, [balanceChange, hasBalanceChange])

  const renderSpendLimits = (): JSX.Element | null => {
    if (spendLimits.length === 0 || hasBalanceChange) {
      return null
    }

    return (
      <SpendLimits
        spendLimits={spendLimits}
        onSelect={canEdit ? updateSpendLimit : undefined}
      />
    )
  }

  const renderNetworkFeeSelectorWithGasless =
    useCallback((): JSX.Element | null => {
      if (!displayData.networkFeeSelector) return null

      let gasLimit: number | undefined

      if (
        typeof signingData.data === 'object' &&
        'gasLimit' in signingData.data
      ) {
        gasLimit = Number(signingData.data.gasLimit || 0)
      }

      return (
        <View sx={{ marginTop: 12 }}>
          <NetworkFeeSelectorWithGasless
            gaslessEnabled={gaslessEnabled}
            setGaslessEnabled={setGaslessEnabled}
            gasLimit={gasLimit}
            caip2ChainId={caip2ChainId}
            handleFeesChange={handleFeesChange}
            shouldShowGaslessSwitch={shouldShowGaslessSwitch}
          />
        </View>
      )
    }, [
      caip2ChainId,
      displayData.networkFeeSelector,
      gaslessEnabled,
      setGaslessEnabled,
      shouldShowGaslessSwitch,
      signingData.data,
      handleFeesChange
    ])

  const alert = displayData.alert
    ? {
        type: displayData.alert.type,
        message: displayData.alert.details.description
      }
    : undefined

  return (
    <ActionSheet
      isModal
      title={displayData.dAppInfo ? undefined : displayData.title}
      navigationTitle={
        displayData.dAppInfo ? displayData?.dAppInfo?.name : displayData.title
      }
      onClose={onReject}
      alert={alert}
      confirm={{
        label: 'Approve',
        onPress: handleApprove,
        disabled: approveDisabled,
        isLoading: submitting
      }}
      cancel={{
        label: 'Reject',
        onPress: rejectAndClose,
        disabled: submitting
      }}>
      {renderDappInfoOrTitle()}
      {renderGaslessAlert()}
      {renderBalanceChange()}
      {renderSpendLimits()}
      {renderAccountAndNetwork()}
      {renderDetails()}
      {renderNetworkFeeSelectorWithGasless()}
    </ActionSheet>
  )
}

export default withWalletConnectCache('approvalParams')(ApprovalScreen)
