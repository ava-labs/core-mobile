import React, {
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo
} from 'react'
import { LayoutChangeEvent } from 'react-native'
import {
  Icons,
  Separator,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenLogo } from 'new/common/components/TokenLogo'
import { ApprovalParams } from 'services/walletconnectv2/walletConnectCache/types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import Logger from 'utils/Logger'
import { useGasless } from 'hooks/useGasless'
import { selectAccountByIndex } from 'store/account/slice'
import { selectAccountByAddress } from 'store/account/slice'
import { useNativeTokenWithBalance } from 'screens/send/hooks/useNativeTokenWithBalance'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { selectActiveAccount } from 'store/account/slice'
import { selectIsSeedlessSigningBlocked } from 'store/posthog/slice'
import { useSelector } from 'react-redux'
import { useNetworks } from 'hooks/networks/useNetworks'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { validateFee } from 'screens/send/utils/evm/validate'
import { SendErrorMessage } from 'screens/send/utils/types'
import { router } from 'expo-router'
import { Eip1559Fees } from 'utils/Utils'
import { ActionSheet } from 'new/common/components/ActionSheet'
import { Details } from '../components/Details'
import { Network } from '../components/Network'
import { NetworkFeeSelectorWithGasless } from '../components/NetworkFeeSelectorWithGasless'
import { Account } from '../components/Account'
import BalanceChange from '../components/BalanceChange'

// import { SpendLimits } from '../components/SpendLimits'

const ApprovalScreenWrapper = (): JSX.Element | null => {
  const [params, setParams] = useState<ApprovalParams>()

  useLayoutEffect(() => {
    setParams(walletConnectCache.approvalParams.get())
  }, [])

  if (!params) {
    return null
  }

  return <ApprovalScreen params={params} />
}

const ApprovalScreen = ({
  params: { request, displayData, signingData, onApprove, onReject }
}: {
  params: ApprovalParams
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
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

  //   const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
  //     useSpendLimits(displayData.tokenApprovals)

  const filteredSections = useMemo(() => {
    return displayData.details.map(detailSection => {
      if (detailSection.title !== 'Transaction Details') {
        return detailSection
      }

      const filteredItems = detailSection.items.filter(item => {
        if (typeof item === 'string') return true

        // const isDataOrInAppWebsite = false
        const isDataOrInAppWebsite =
          item.label.toLowerCase() === 'website' && isInAppRequest(request)

        return !isDataOrInAppWebsite
      })

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
        network,
        account,
        maxFeePerGas,
        maxPriorityFeePerGas
        //overrideData: hashedCustomSpend
      })
      router.canGoBack() && router.back()
    } catch (error: unknown) {
      Logger.error('Error approving transaction', error)
    } finally {
      setSubmitting(false)
    }
  }, [
    account,
    approveDisabled,
    gaslessEnabled,
    handleGaslessTx,
    maxFeePerGas,
    maxPriorityFeePerGas,
    network,
    onApprove,
    shouldShowGaslessSwitch
  ])

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

  // const handleEditSpendLimit = () => {}

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

  const renderGaslessAlert = (): JSX.Element | null => {
    if (!gaslessError) return null

    return (
      <View style={{ marginVertical: 12 }}>
        <Text>{gaslessError.details.description}</Text>
      </View>
    )
    // return (
    //   <View sx={{ marginVertical: 12 }}>
    //     <AlertBanner
    //       alert={gaslessError}
    //       customStyle={{
    //         borderColor: '$dangerLight',
    //         backgroundColor: '$transparent',
    //         iconColor: colors.$white
    //       }}
    //     />
    //   </View>
    // )
  }

  const renderDappInfo = (
    handleHeaderLayout: (event: LayoutChangeEvent) => void
  ): JSX.Element | null => {
    if (!displayData.dAppInfo) return null

    const { action, logoUri } = displayData.dAppInfo

    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 36
        }}>
        <View onLayout={handleHeaderLayout}>
          <TokenLogo logoUri={logoUri} size={62} />
        </View>
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
  }

  const renderDisclaimer = (): JSX.Element | null => {
    if (!displayData.disclaimer) return null

    return (
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
          paddingRight: 26,
          marginBottom: 19
        }}>
        <Icons.Action.Info width={20} height={20} color={colors.$textDanger} />
        <Text
          sx={{
            marginLeft: 8,
            fontSize: 15,
            lineHeight: 20,
            color: '$textDanger',
            fontWeight: '500'
          }}
          variant="body1">
          {displayData.disclaimer}
        </Text>
      </View>
    )
  }

  const renderAccountAndNetwork = (): JSX.Element | undefined => {
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
            name={displayData.network.name}
          />
        </View>
      )
    }

    if (displayData.network) {
      return (
        <Network
          logoUri={displayData.network.logoUri}
          name={displayData.network.name}
        />
      )
    }

    if (displayData.account) {
      return <Account address={displayData.account} />
    }
  }

  const renderDetails = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          marginTop: 12
        }}>
        {filteredSections.map((detailSection, index) => (
          <Details key={index} detailSection={detailSection} />
        ))}
      </View>
    )
  }, [filteredSections])

  const renderBalanceChange = (): JSX.Element | null => {
    if (!hasBalanceChange) return null

    return <BalanceChange balanceChange={balanceChange} />
  }

  // const renderSpendLimit = (): JSX.Element | null => {
  //   // if (spendLimits.length === 0 || hasBalanceChange) {
  //   //   return null
  //   // }

  //   return (
  //     <SpendLimits
  //       spendLimits={spendLimits}
  //       onEdit={canEdit ? handleEditSpendLimit : undefined}
  //     />
  //   )
  // }

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
      title={displayData.title}
      onClose={onReject}
      alert={alert}
      confirm={{
        label: 'Approve',
        onPress: handleApprove,
        disabled: approveDisabled
      }}
      cancel={{
        label: 'Reject',
        onPress: rejectAndClose,
        disabled: submitting
      }}>
      {({ handleHeaderLayout }) => {
        return (
          <>
            {renderDappInfo(handleHeaderLayout)}
            {renderDisclaimer()}
            {renderGaslessAlert()}
            {renderAccountAndNetwork()}
            {renderBalanceChange()}
            {/* {renderSpendLimit()} */}
            {renderDetails()}
            {renderNetworkFeeSelectorWithGasless()}
          </>
        )
      }}
    </ActionSheet>
  )
}

export default ApprovalScreenWrapper
