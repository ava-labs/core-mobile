import {
  NavigationTitleHeader,
  SearchBar,
  Text,
  View,
  FlatList,
  SPRING_LINEAR_TRANSITION,
  useTheme,
  TouchableOpacity
} from '@avalabs/k2-alpine'
import React, { useCallback, useState, useMemo } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useConnectedDapps } from 'features/accountSettings/hooks/useConnectedDapps'
import { Dapp } from 'screens/rpc/ConnectedDapps/types'
import { Logo } from 'common/components/Logo'

const ConnectedSitesScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { allApprovedDapps, killSession } = useConnectedDapps()

  const [searchText, setSearchText] = useState('')
  const headerOpacity = useSharedValue(1)
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: (
      <NavigationTitleHeader
        title={`${allApprovedDapps.length} connected sites`}
      />
    ),
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: true
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleHeaderLayout = (event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }

  const disconnectDapp = useCallback(
    async (topic: string): Promise<void> => {
      killSession(topic)
    },
    [killSession]
  )

  const searchResults = useMemo(() => {
    if (searchText === '') {
      return allApprovedDapps
    }
    return allApprovedDapps.filter(
      dapp =>
        dapp.dapp.peer.metadata.name
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        dapp.dapp.peer.metadata.url
          .toLowerCase()
          .includes(searchText.toLowerCase())
    )
  }, [allApprovedDapps, searchText])

  const renderItem = useCallback(
    (item: Dapp, index: number): React.JSX.Element => {
      const { name, url, icons } = item.dapp.peer.metadata
      return (
        <Animated.View
          entering={getListItemEnteringAnimation(index)}
          layout={SPRING_LINEAR_TRANSITION}>
          <View
            sx={{
              paddingLeft: 10,
              paddingRight: 12,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              backgroundColor: colors.$surfaceSecondary
            }}>
            <Logo
              logoUri={icons[0]}
              backgroundColor={colors.$borderPrimary}
              borderColor={colors.$borderPrimary}
            />
            <View
              sx={{
                flex: 1,
                marginHorizontal: 12
              }}>
              <Text
                variant="buttonMedium"
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ fontSize: 16, lineHeight: 16, flexGrow: 1 }}>
                {name}
              </Text>
              <Text
                variant="body2"
                sx={{ lineHeight: 16, color: colors.$textSecondary }}
                ellipsizeMode="tail"
                numberOfLines={1}>
                {url}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => disconnectDapp(item.dapp.topic)}
              sx={{
                width: 100,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.$borderPrimary,
                height: 27,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5
              }}>
              <Text variant="buttonSmall">Disconnect</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )
    },
    [
      colors.$borderPrimary,
      colors.$surfaceSecondary,
      colors.$textSecondary,
      disconnectDapp
    ]
  )

  const renderSeparator = (): JSX.Element => <View sx={{ height: 12 }} />

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onScroll}
      data={searchResults}
      contentContainerStyle={{
        paddingBottom: 60,
        flexGrow: 1,
        paddingHorizontal: 16
      }}
      keyExtractor={(item): string => (item as Dapp).id}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={
        <View sx={{ gap: 16, marginBottom: 16 }}>
          <Animated.View
            style={[{ opacity: headerOpacity }, animatedHeaderStyle]}
            onLayout={handleHeaderLayout}>
            <Text variant="heading2">
              {allApprovedDapps.length} connected sites
            </Text>
          </Animated.View>
          <SearchBar
            onTextChanged={setSearchText}
            searchText={searchText}
            placeholder="Search"
            useDebounce={true}
          />
        </View>
      }
      renderItem={item => renderItem(item.item as Dapp, item.index)}
    />
  )
}

export default ConnectedSitesScreen
