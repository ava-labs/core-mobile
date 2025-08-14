import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import {
  ANIMATED,
  Chip,
  Image,
  SPRING_LINEAR_TRANSITION,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { DropdownSelection } from 'common/types'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { ErrorState } from 'new/common/components/ErrorState'
import { LoadingState } from 'new/common/components/LoadingState'
import React, { useCallback, useMemo } from 'react'
import { Platform, ViewStyle } from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import { DropdownMenu } from 'common/components/DropdownMenu'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { ActivityList } from '../components/ActivityList'
import { useActivityFilterAndSearch } from '../hooks/useActivityFilterAndSearch'

const errorIcon = require('../../../assets/icons/unamused_emoji.png')

export const ActivityScreen = ({
  isSearchBarFocused,
  searchText,
  containerStyle,
  handleExplorerLink,
  handlePendingBridge
}: {
  isSearchBarFocused: boolean
  searchText: string
  handleExplorerLink: (explorerLink: string) => void
  handlePendingBridge: (transaction: BridgeTransaction | BridgeTransfer) => void
  containerStyle: ViewStyle
}): JSX.Element => {
  const header = useHeaderMeasurements()

  const {
    data,
    filter,
    isLoading,
    isRefreshing,
    isError,
    xpToken,
    network,
    networkFilterDropdown,
    refresh
  } = useActivityFilterAndSearch({ searchText })

  const keyboardAvoidingStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(
            isSearchBarFocused
              ? -header.height + (Platform.OS === 'ios' ? 40 : 32)
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
    if (isRefreshing || isLoading) {
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

    return (
      <ErrorState
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No recent transactions"
        description="Interact with this token onchain and see your activity here"
      />
    )
  }, [isError, isLoading, isRefreshing, refresh, searchText.length])

  const renderEmpty = useCallback(() => {
    return (
      <CollapsibleTabs.ContentWrapper
        height={
          Number(containerStyle.minHeight) - (Platform.OS === 'ios' ? 50 : 32)
        }>
        <Animated.View
          style={[keyboardAvoidingStyle, { justifyContent: 'center' }]}>
          {emptyComponent}
        </Animated.View>
      </CollapsibleTabs.ContentWrapper>
    )
  }, [containerStyle.minHeight, emptyComponent, keyboardAvoidingStyle])

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <ActivityList
        data={data}
        xpToken={xpToken}
        handlePendingBridge={handlePendingBridge}
        handleExplorerLink={handleExplorerLink}
        overrideProps={{
          contentContainerStyle: {
            ...containerStyle
          }
        }}
        renderHeader={renderHeader}
        renderEmpty={renderEmpty}
        isRefreshing={isRefreshing}
        refresh={refresh}
      />
    </Animated.View>
  )
}

const NetworkFilterDropdown = ({
  network,
  title,
  data,
  onSelected
}: {
  network: Network
  title: DropdownSelection['title']
  data: DropdownSelection['data']
  onSelected: DropdownSelection['onSelected']
}): JSX.Element => {
  const { theme } = useTheme()

  const renderLeftIcon = useCallback(() => {
    if (!network) return <></>

    return (
      <NetworkLogoWithChain
        network={network}
        networkSize={18}
        outerBorderColor={theme.colors.$surfaceSecondary}
        showChainLogo={false}
      />
    )
  }, [network, theme.colors.$surfaceSecondary])

  return (
    <DropdownMenu
      groups={data}
      onPressAction={(event: { nativeEvent: { event: string } }) =>
        onSelected(event.nativeEvent.event)
      }>
      <Chip
        renderLeft={renderLeftIcon}
        style={{
          paddingLeft: 6,
          paddingRight: 10,
          gap: 4
        }}
        size="large"
        hitSlop={8}
        testID="network_dropdown_btn">
        {title}
      </Chip>
    </DropdownMenu>
  )
}
