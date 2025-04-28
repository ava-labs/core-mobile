import { NavigationTitleHeader } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View
} from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import Animated, {
  FlatListPropsWithLayout,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurViewWithFallback } from './BlurViewWithFallback'
import { ErrorState } from './ErrorState'
import { KeyboardAvoidingView } from './KeyboardAvoidingView'
import ScreenHeader from './ScreenHeader'

interface FlatListScreenTemplateProps<T>
  extends Omit<FlatListPropsWithLayout<T>, 'ListHeaderComponent'> {
  title: string
  data: T[]
  hasParent?: boolean
  isModal?: boolean
  renderHeader: () => React.ReactNode
  renderHeaderRight?: () => React.ReactNode
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export const FlatListScreenTemplate = <T,>({
  data,
  title,
  hasParent = false,
  isModal = false,
  ListEmptyComponent,
  renderHeader,
  renderHeaderRight,
  ...props
}: FlatListScreenTemplateProps<T>): React.ReactNode => {
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const headerRef = useRef<View>(null)
  const contentHeaderHeight = useSharedValue<number>(0)

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={title} />,
      targetLayout: headerLayout,
      shouldHeaderHaveGrabber: isModal,
      hasParent: hasParent
    }
  )

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-contentHeaderHeight.value, 0, contentHeaderHeight.value],
      [1.05, 1, 0.95]
    )
    return {
      opacity: data.length === 0 ? 1 : 1 - targetHiddenProgress.value * 2,
      transform: [{ scale: data.length === 0 ? 1 : scale }]
    }
  })

  useLayoutEffect(() => {
    if (headerRef.current) {
      headerRef.current.measure((x, y, width, height) => {
        contentHeaderHeight.value = height
        setHeaderLayout({ x, y, width, height })
      })
    }
  }, [contentHeaderHeight])

  useFocusEffect(
    useCallback(() => {
      if (hasParent) {
        navigation.getParent()?.setOptions({
          headerRight: renderHeaderRight
        })
        return () => {
          navigation.getParent()?.setOptions({
            headerRight: renderHeaderRight ?? undefined
          })
        }
      } else {
        navigation.setOptions({
          headerRight: renderHeaderRight
        })
        return () => {
          navigation?.setOptions({
            headerRight: renderHeaderRight ?? undefined
          })
        }
      }
    }, [hasParent, navigation, renderHeaderRight])
  )

  // const onScroll = useAnimatedScrollHandler({
  //   onScroll: event => {
  //     scrollY.value = event.contentOffset.y
  //   }
  // })

  const onScrollEvent = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (data.length > 0) {
        onScroll(event)
      }
    },
    [data.length, onScroll]
  )

  return (
    <KeyboardAvoidingView keyboardVerticalOffset={insets.bottom}>
      <AnimatedFlatList
        style={{
          flex: 1
        }}
        layout={LinearTransition.springify()}
        entering={getListItemEnteringAnimation(0)}
        data={data}
        onScroll={onScrollEvent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={15}
        windowSize={5}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        {...props}
        ListHeaderComponent={
          <BlurViewWithFallback
            style={{
              paddingBottom: 12,
              paddingHorizontal: 16,
              paddingTop: data.length === 0 ? headerHeight : 0
            }}>
            <Animated.View
              style={[
                animatedHeaderStyle,
                {
                  paddingTop: 14
                }
              ]}
              ref={headerRef}>
              <ScreenHeader title={title} />
            </Animated.View>

            {renderHeader()}
          </BlurViewWithFallback>
        }
        contentContainerStyle={[
          props?.contentContainerStyle,
          data.length === 0
            ? {
                justifyContent: 'center',
                flex: 1
              }
            : {
                paddingTop: headerLayout?.height ? headerLayout.height - 16 : 0
              },
          {
            paddingBottom: insets.bottom
          }
        ]}
        ListEmptyComponent={
          ListEmptyComponent ?? (
            <ErrorState
              sx={{ flex: 1 }}
              title="No results"
              description="Try a different search"
            />
          )
        }
      />
    </KeyboardAvoidingView>
  )
}
