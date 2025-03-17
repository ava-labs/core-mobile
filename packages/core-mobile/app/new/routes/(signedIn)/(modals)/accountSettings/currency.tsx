import {
  Icons,
  NavigationTitleHeader,
  SearchBar,
  Text,
  View,
  FlatList,
  SPRING_LINEAR_TRANSITION,
  Separator,
  useTheme,
  TouchableOpacity,
  Image
} from '@avalabs/k2-alpine'
import React, { useCallback, useState, useMemo } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import {
  currencies,
  selectSelectedCurrency,
  setSelectedCurrency,
  type Currency
} from 'store/settings/currency'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { CurrencyIcon } from 'common/components/CurrencyIcon'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'expo-router'
import { ErrorState } from 'common/components/ErrorState'

const CurrencyScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { canGoBack, back } = useRouter()
  const [searchText, setSearchText] = useState('')
  const headerOpacity = useSharedValue(1)
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const selectedCurrencySymbol = useSelector(selectSelectedCurrency)
  const dispatch = useDispatch()
  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: <NavigationTitleHeader title={'Select a currency'} />,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: true
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleHeaderLayout = (event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }

  const searchResults = useMemo(() => {
    if (searchText === '') {
      return currencies
    }
    return currencies.filter(
      currency =>
        currency.name.toLowerCase().includes(searchText.toLowerCase()) ||
        currency.symbol.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [searchText])

  const renderItem = useCallback(
    (item: Currency, index: number): React.JSX.Element => {
      const { name, symbol } = item
      const isLastItem = index === searchResults.length - 1
      const isSelected = symbol === selectedCurrencySymbol
      return (
        <Animated.View
          entering={getListItemEnteringAnimation(index)}
          layout={SPRING_LINEAR_TRANSITION}>
          <TouchableOpacity
            sx={{ marginTop: 12 }}
            onPress={() => {
              dispatch(setSelectedCurrency(symbol))
              canGoBack() && back()
            }}>
            <View
              sx={{
                paddingLeft: 16,
                paddingRight: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12
              }}>
              <View
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  overflow: 'hidden'
                }}>
                <CurrencyIcon symbol={symbol} />
              </View>
              <View
                sx={{
                  flexGrow: 1,
                  marginHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                <View
                  sx={{
                    flexShrink: 1
                  }}>
                  <Text
                    variant="buttonMedium"
                    numberOfLines={1}
                    sx={{ flex: 1 }}>
                    {name}
                  </Text>
                  <Text
                    variant="body2"
                    sx={{ lineHeight: 16, flex: 1 }}
                    ellipsizeMode="tail"
                    numberOfLines={1}>
                    {symbol}
                  </Text>
                </View>
                {isSelected && (
                  <Icons.Navigation.Check color={colors.$textPrimary} />
                )}
              </View>
            </View>
            {!isLastItem && (
              <View sx={{ marginLeft: 62 }}>
                <Separator />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )
    },
    [
      back,
      canGoBack,
      colors.$textPrimary,
      dispatch,
      searchResults.length,
      selectedCurrencySymbol
    ]
  )

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onScroll}
      data={searchResults}
      contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }}
      keyExtractor={(item): string => (item as Currency).symbol}
      ListEmptyComponent={
        <ErrorState
          sx={{ flex: 1 }}
          icon={
            <Image
              source={require('../../../../assets/icons/melting_face.png')}
              sx={{ width: 42, height: 42 }}
            />
          }
          title="No currency found."
          description=""
        />
      }
      ListHeaderComponent={
        <View sx={{ gap: 16, marginHorizontal: 16, marginBottom: 16 }}>
          <Animated.View
            style={[{ opacity: headerOpacity }, animatedHeaderStyle]}
            onLayout={handleHeaderLayout}>
            <Text variant="heading2">Select a currency</Text>
          </Animated.View>
          <SearchBar
            onTextChanged={setSearchText}
            searchText={searchText}
            placeholder="Search"
            useDebounce={true}
          />
        </View>
      }
      renderItem={item => renderItem(item.item as Currency, item.index)}
    />
  )
}

export default CurrencyScreen
