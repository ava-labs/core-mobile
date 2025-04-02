import {
  Icons,
  NavigationTitleHeader,
  Text,
  ScrollView,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useState } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import ScreenHeader from 'common/components/ScreenHeader'
import MnemonicScreen from 'features/onboarding/components/MnemonicPhrase'
import { useLocalSearchParams } from 'expo-router'
import { SHOW_RECOVERY_PHRASE } from 'features/accountSettings/consts'

const navigationHeader = (
  <NavigationTitleHeader title={'Show recovery phrase'} />
)

const ShowRecoveryPhraseScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const headerOpacity = useSharedValue(1)
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: navigationHeader,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: true
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleHeaderLayout = (event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }

  return (
    <ScrollView
      onScroll={onScroll}
      contentContainerSx={{
        paddingBottom: 60,
        paddingHorizontal: 16
      }}
      showsVerticalScrollIndicator={false}>
      <Animated.View
        style={[{ opacity: headerOpacity }, animatedHeaderStyle]}
        onLayout={handleHeaderLayout}>
        <ScreenHeader
          title={SHOW_RECOVERY_PHRASE}
          description="This phrase is your access key to your wallet. Carefully write it
        down and store it in a safe This phrase is your access key to your wallet. Carefully write it down and store it in a safe location"
        />
      </Animated.View>
      <View sx={{ marginTop: 16, gap: 16 }}>
        <View sx={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icons.Alert.ErrorOutline color={colors.$textDanger} />
          <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
            Losing this phrase will result in lost funds
          </Text>
        </View>
        <MnemonicScreen mnemonic={mnemonic} />
      </View>
    </ScrollView>
  )
}

export default ShowRecoveryPhraseScreen
