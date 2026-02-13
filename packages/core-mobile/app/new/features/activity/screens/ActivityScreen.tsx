import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import {
  ANIMATED,
  Image,
  SPRING_LINEAR_TRANSITION,
  View
} from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { getSourceChainId } from 'common/utils/bridgeUtils'
import { useRouter } from 'expo-router'
import { useIsLoadingBalancesForAccount } from 'features/portfolio/hooks/useIsLoadingBalancesForAccount'
import { ErrorState } from 'new/common/components/ErrorState'
import { LoadingState } from 'new/common/components/LoadingState'
import React, { useCallback, useMemo } from 'react'
import { Platform, ViewStyle } from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'
import { isSolanaChainId } from 'utils/network/isSolanaNetwork'
import { ActivityList } from '../components/ActivityList'
import { NetworkFilterDropdown } from '../components/NetworkFilterDropdown'
import { useActivityFilterAndSearch } from '../hooks/useActivityFilterAndSearch'

const errorIcon = require('../../../assets/icons/unamused_emoji.png')
const viewInExplorerIcon = require('../../../assets/icons/flashlight.png')

export const ActivityScreen = ({
  isSearchBarFocused = false,
  searchText = '',
  containerStyle
}: {
  isSearchBarFocused?: boolean
  searchText?: string
  containerStyle: ViewStyle
}): JSX.Element => {
  const { navigate } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { openUrl } = useInAppBrowser()
  const header = useHeaderMeasurements()
  const collapsibleHeaderHeight = header?.height ?? 0
  const {
    data,
    filter,
    isLoading,
    isRefreshing,
    isError,
    xpToken,
    network,
    networkFilterDropdown,
    isXpChain,
    refresh
  } = useActivityFilterAndSearch({ searchText })
  const account = useSelector(selectActiveAccount)
  const isLoadingBalances = useIsLoadingBalancesForAccount(account)

  const handlePendingBridge = useCallback(
    (pendingBridge: BridgeTransaction | BridgeTransfer): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/bridgeStatus',
        params: {
          txHash: pendingBridge.sourceTxHash,
          chainId: getSourceChainId(pendingBridge, isDeveloperMode)
        }
      })
    },
    [navigate, isDeveloperMode]
  )

  const handleExplorerLink = useCallback(
    (
      explorerLink: string,
      hash?: string,
      hashType?: 'account' | 'tx'
    ): void => {
      AnalyticsService.capture('ExplorerLinkClicked')
      const url = getExplorerAddressByNetwork(explorerLink, hash, hashType)
      openUrl(url)
    },
    [openUrl]
  )

  const isSolanaNetwork = network && isSolanaChainId(network.chainId)

  const isLoadingXpToken = useMemo(() => {
    return isXpChain && isLoadingBalances
  }, [isXpChain, isLoadingBalances])

  const keyboardAvoidingStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(
            isSearchBarFocused
              ? -collapsibleHeaderHeight + (Platform.OS === 'ios' ? 40 : 32)
              : 0,
            {
              ...ANIMATED.TIMING_CONFIG
            }
          )
        }
      ]
    }
  })

  const renderHeader = useCallback(() => {
    return (
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 16,
          marginTop: 4,
          marginBottom: 16,
          paddingHorizontal: 16
        }}>
        <DropdownSelections filter={filter} />
        <NetworkFilterDropdown network={network} {...networkFilterDropdown} />
      </View>
    )
  }, [filter, network, networkFilterDropdown])

  const emptyComponent = useMemo(() => {
    if (isRefreshing || isLoading || isLoadingXpToken) {
      return <LoadingState />
    }

    if (searchText.length > 0) {
      return <ErrorState title="No results found" description="" />
    }

    if (isError) {
      return (
        <ErrorState
          button={{
            title: 'Refresh',
            onPress: refresh
          }}
        />
      )
    }

    if (isSolanaNetwork) {
      return (
        <ErrorState
          icon={
            <Image source={viewInExplorerIcon} sx={{ width: 42, height: 42 }} />
          }
          title={`View transaction\ndetails in the Explorer`}
          description="Visit the Explorer for more info"
          button={{
            title: 'View in Explorer',
            onPress: () =>
              handleExplorerLink(
                network?.explorerUrl ?? '',
                account?.addressSVM,
                'account'
              )
          }}
        />
      )
    }

    return (
      <ErrorState
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No recent transactions"
        description="Interact with this token onchain and see your activity here"
      />
    )
  }, [
    account?.addressSVM,
    handleExplorerLink,
    isError,
    isLoading,
    isLoadingXpToken,
    isRefreshing,
    isSolanaNetwork,
    network?.explorerUrl,
    refresh,
    searchText.length
  ])

  const renderEmpty = useCallback(() => {
    return (
      <CollapsibleTabs.ContentWrapper>
        <Animated.View
          style={[keyboardAvoidingStyle, { justifyContent: 'center' }]}>
          {emptyComponent}
        </Animated.View>
      </CollapsibleTabs.ContentWrapper>
    )
  }, [emptyComponent, keyboardAvoidingStyle])

  const activityListData = useMemo(() => {
    return isLoadingXpToken ? [] : data
  }, [data, isLoadingXpToken])

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <ActivityList
        data={activityListData}
        xpToken={xpToken}
        handlePendingBridge={handlePendingBridge}
        handleExplorerLink={handleExplorerLink}
        containerStyle={containerStyle}
        renderHeader={renderHeader}
        renderEmpty={renderEmpty}
        isRefreshing={isRefreshing}
        refresh={refresh}
      />
    </Animated.View>
  )
}
