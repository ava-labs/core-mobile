import React, { useMemo } from 'react'
import {
  GroupList,
  Icons,
  SCREEN_WIDTH,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { Space } from 'common/components/Space'
import { StyleSheet } from 'react-native'
import { isSmallScreen } from 'utils/isSmallScreen'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isAndroid } from 'utils/Utils'

const WIDTH = SCREEN_WIDTH - 32

export const EmptyState = ({
  goToBuy
}: {
  goToBuy: () => void
}): JSX.Element => {
  const {
    theme: { isDark, colors }
  } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const groupListData = useMemo(() => {
    return [
      {
        title: 'Buy crypto',
        subtitle: `Buy tokens such as AVAX with a debit card or your bank account`,
        onPress: goToBuy,
        leftIcon: (
          <View sx={Styles.leftIcon}>
            <Icons.Content.Add color={colors.$textPrimary} />
          </View>
        )
      },
      {
        title: 'Transfer crypto',
        subtitle: 'Move funds from another wallet or exchange',
        // @ts-ignore TODO: make routes typesafe
        onPress: () => router.navigate('/receive'),
        leftIcon: (
          <View sx={Styles.leftIcon}>
            <Icons.Custom.Compare color={colors.$textPrimary} />
          </View>
        )
      }
    ]
  }, [colors.$textPrimary, goToBuy, router])

  return (
    <View
      sx={{
        width: WIDTH,
        overflow: 'hidden',
        borderRadius: 12,
        flex: 1,
        marginTop: 64,
        backgroundColor: '$surfaceSecondary'
      }}>
      <View
        sx={{
          position: 'absolute',
          zIndex: 1,
          top: -100,
          left: -50
        }}>
        {isDark ? (
          <Icons.Custom.AvaxDarkGradient opacity={isSmallScreen ? 0.2 : 1} />
        ) : (
          <Icons.Custom.AvaxLightGradient opacity={isSmallScreen ? 0.2 : 1} />
        )}
      </View>

      <View
        sx={{
          zIndex: 100,
          justifyContent: 'flex-end',
          flex: 1,
          marginBottom: 64 + (isAndroid ? insets.bottom + 80 : 0)
        }}>
        <Text
          variant="heading3"
          sx={{ color: '$textPrimary', marginHorizontal: 16 }}>
          Get started by adding crypto to your wallet
        </Text>
        <Space y={16} />
        <GroupList
          data={groupListData}
          titleSx={{ fontFamily: 'Inter-regular', fontSize: 15 }}
          subtitleSx={{ marginRight: 16 }}
          textContainerSx={{
            paddingVertical: 4
          }}
        />
      </View>
    </View>
  )
}

const Styles = StyleSheet.create({
  leftIcon: {
    backgroundColor: '$borderPrimary',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
