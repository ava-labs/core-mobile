import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  GroupList,
  GroupListItem,
  Icons,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { UTCDate } from '@date-fns/utc'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { copyToClipboard } from 'common/utils/clipboard'
import { transactionSnackbar } from 'common/utils/toast'
import { useDelegationContext } from 'contexts/DelegationContext'
import {
  differenceInDays,
  format,
  getUnixTime,
  secondsToMilliseconds
} from 'date-fns'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import { useStakeEstimatedReward } from 'features/stake/hooks/useStakeEstimatedReward'
import { useValidateStakingEndTime } from 'features/stake/utils/useValidateStakingEndTime'
import { useGetValidatorByNodeId } from 'hooks/earn/useGetValidatorByNodeId'
import { useIssueDelegation } from 'hooks/earn/useIssueDelegation'
import { useNodes } from 'hooks/earn/useNodes'
import { useSearchNode } from 'hooks/earn/useSearchNode'
import { useNow } from 'hooks/time/useNow'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account'
import { getAccountIndex } from 'store/account/utils'
import { scheduleStakingCompleteNotifications } from 'store/notifications'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { truncateNodeId } from 'utils/Utils'

const StakeConfirmScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { back, dismissAll, navigate } = useRouter()
  const dispatch = useDispatch()
  const { stakeAmount, networkFees } = useDelegationContext()
  const { stakeEndTime, nodeId } = useLocalSearchParams<{
    stakeEndTime: string
    nodeId?: string
  }>()
  const stakeEndTimeInMilliseconds = useMemo(
    () => new UTCDate(secondsToMilliseconds(Number(stakeEndTime))),
    [stakeEndTime]
  )
  const now = useNow()
  const {
    isFetching: isFetchingNodes,
    error,
    data
  } = useNodes(nodeId === undefined)
  const { validator: searchedValidator, error: searchNodeError } =
    useSearchNode({
      stakingAmount: stakeAmount,
      stakingEndTime: stakeEndTimeInMilliseconds,
      validators: data?.validators
    })
  const selectedValidator = useGetValidatorByNodeId(nodeId)
  const validator = useMemo(
    // Use the validator selected by the user from the advanced flow, if available.
    () => selectedValidator ?? searchedValidator,
    [searchedValidator, selectedValidator]
  )

  const activeAccount = useSelector(selectActiveAccount)

  const validatorEndTimeUnix = useMemo(() => {
    if (validator?.endTime) {
      return Number(validator?.endTime)
    }
    return 0
  }, [validator?.endTime])
  const { minStartTime, validatedStakingEndTime, validatedStakingDuration } =
    useValidateStakingEndTime(stakeEndTimeInMilliseconds, validatorEndTimeUnix)

  const localValidatedStakingEndTime = useMemo(() => {
    return new Date(validatedStakingEndTime.getTime())
  }, [validatedStakingEndTime])
  const estimatedReward = useStakeEstimatedReward({
    amount: stakeAmount,
    duration: validatedStakingDuration,
    delegationFee: Number(validator?.delegationFee)
  })
  const [isAlertVisible, setIsAlertVisible] = useState(false)

  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const networkFeesInAvax = useMemo(
    () =>
      new TokenUnit(
        networkFees,
        pNetwork.networkToken.decimals,
        pNetwork.networkToken.symbol
      ).toDisplay({ fixedDp: 6 }),
    [networkFees, pNetwork.networkToken.decimals, pNetwork.networkToken.symbol]
  )

  const delegationFee = useMemo(() => {
    if (
      estimatedReward?.estimatedTokenReward === undefined ||
      validator?.delegationFee === undefined
    )
      return undefined

    return estimatedReward.estimatedTokenReward
      .mul(validator.delegationFee)
      .div(100)
  }, [estimatedReward?.estimatedTokenReward, validator?.delegationFee])

  const amountSection: GroupListItem[] = useMemo(() => {
    const section = [
      {
        title: 'Staked amount',
        value: <StakeTokenUnitValue value={stakeAmount} />
      }
    ]

    if (estimatedReward) {
      section.push({
        title: 'Estimated reward',
        value: (
          <StakeTokenUnitValue
            value={estimatedReward?.estimatedTokenReward}
            isReward
          />
        )
      })
    }

    return section
  }, [stakeAmount, estimatedReward])

  const stakeSection: GroupListItem[] = useMemo(() => {
    const section = []

    if (selectedValidator) {
      section.push({
        title: 'NodeID',
        subtitle: truncateNodeId(selectedValidator.nodeID, 14),
        accessory: (
          <Button
            size="small"
            type="secondary"
            onPress={() => copyToClipboard(selectedValidator.nodeID)}>
            Copy
          </Button>
        ),
        onPress: () => {
          copyToClipboard(selectedValidator.nodeID)
        }
      })
    }

    section.push(
      ...[
        {
          title: 'Time to unlock',
          value: `${differenceInDays(validatedStakingEndTime, now)} days`
        },
        {
          title: 'Locked until',
          value: format(localValidatedStakingEndTime, 'MM/dd/yyyy h:mm aa')
        },
        {
          title: 'Estimated network fee',
          value: `${networkFeesInAvax} AVAX`
        },
        {
          title: 'Stake fee',
          value: `${delegationFee?.toDisplay()} AVAX`
        }
      ]
    )

    return section
  }, [
    validatedStakingEndTime,
    localValidatedStakingEndTime,
    delegationFee,
    networkFeesInAvax,
    now,
    selectedValidator
  ])

  const handleStartOver = useCallback((): void => {
    dismissAll()
  }, [dismissAll])

  const handleDismiss = useCallback((): void => {
    dismissAll()
    back()
  }, [dismissAll, back])

  const handleCancel = useCallback((): void => {
    showAlert({
      title: 'Cancel Stake Setup?',
      description: 'Your stake setup will not go through if you close now',
      buttons: [
        {
          text: 'Back'
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            handleDismiss()
          }
        }
      ]
    })
  }, [handleDismiss])

  const onDelegationSuccess = useCallback(
    (txHash: string): void => {
      AnalyticsService.capture('StakeDelegationSuccess')
      transactionSnackbar.success({ message: 'Stake successful' })

      handleDismiss()
      // @ts-ignore TODO: make routes typesafe
      navigate('/stake')

      dispatch(
        scheduleStakingCompleteNotifications([
          {
            txHash,
            endTimestamp: getUnixTime(validatedStakingEndTime),
            accountIndex: getAccountIndex(activeAccount),
            isDeveloperMode
          }
        ])
      )
    },
    [
      activeAccount,
      dispatch,
      isDeveloperMode,
      validatedStakingEndTime,
      handleDismiss,
      navigate
    ]
  )

  const onDelegationError = useCallback((e: Error): void => {
    AnalyticsService.capture('StakeDelegationFail')
    transactionSnackbar.error({ error: e.message })
  }, [])

  function onFundsStuck(): void {
    showAlert({
      title: 'Funds stuck',
      description:
        'Your stake failed due to network issues. Would you like to keep trying to stake your funds?',
      buttons: [
        {
          text: 'Cancel stake',
          onPress: () => {
            handleDismiss()
          }
        },
        {
          text: 'Try again',
          onPress: () => {
            issueDelegation(true)
          }
        }
      ]
    })
  }

  const { issueDelegationMutation } = useIssueDelegation(
    onDelegationSuccess,
    onDelegationError,
    onFundsStuck
  )

  usePreventScreenRemoval(issueDelegationMutation.isPending)

  useEffect(() => {
    if (
      !isAlertVisible &&
      !isFetchingNodes &&
      (error || searchNodeError || !validator)
    ) {
      showAlert({
        title: 'No match found',
        description:
          'Core was unable to find a node that matches your requirements. Please start over or try again later',
        buttons: [
          {
            text: 'Cancel',
            onPress: handleDismiss
          },
          {
            text: 'Start over',
            onPress: handleStartOver
          }
        ]
      })
      setIsAlertVisible(true)
    }
  }, [
    error,
    searchNodeError,
    validator,
    handleStartOver,
    handleDismiss,
    isAlertVisible,
    isFetchingNodes
  ])

  const issueDelegation = useCallback(
    (recomputeSteps = false): void => {
      if (!validator) return

      AnalyticsService.capture('StakeIssueDelegation')

      issueDelegationMutation.mutate({
        startDate: minStartTime,
        endDate: validatedStakingEndTime,
        nodeId: validator.nodeID,
        recomputeSteps
      })
    },
    [issueDelegationMutation, minStartTime, validatedStakingEndTime, validator]
  )

  const renderFooter = useCallback(() => {
    return (
      <View
        sx={{
          gap: 16
        }}>
        <View
          sx={{
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center'
          }}>
          <Icons.Action.Info color={theme.colors.$textPrimary} />
          <Text variant="body1" sx={{ flexShrink: 1, lineHeight: 20 }}>
            By tapping "Confirm stake" you will lock your AVAX for the stake
            duration you selected
          </Text>
        </View>
        <Button
          type="primary"
          size="large"
          onPress={issueDelegation}
          disabled={issueDelegationMutation.isPending}>
          {issueDelegationMutation.isPending ? (
            <ActivityIndicator />
          ) : (
            'Confirm stake'
          )}
        </Button>
        <Button
          type="tertiary"
          size="large"
          onPress={handleCancel}
          disabled={issueDelegationMutation.isPending}>
          Cancel
        </Button>
      </View>
    )
  }, [
    handleCancel,
    issueDelegation,
    issueDelegationMutation.isPending,
    theme.colors.$textPrimary
  ])

  if (selectedValidator === undefined && (isFetchingNodes || !validator)) {
    return (
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          marginBottom: 60
        }}>
        <ActivityIndicator size="large" />
        <Text>Searching for a node...</Text>
      </View>
    )
  }

  return (
    <ScrollScreen
      isModal
      title={`That's it!\nReview your stake`}
      navigationTitle="Review"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 12, marginTop: 16 }}>
        <GroupList
          data={amountSection}
          textContainerSx={{
            marginTop: 0
          }}
        />
        <GroupList data={stakeSection} />
      </View>
    </ScrollScreen>
  )
}

export default StakeConfirmScreen
