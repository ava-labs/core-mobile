import {
  Button,
  GroupList,
  ScrollView,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useMemo, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import { useDispatch, useSelector } from 'react-redux'
import {
  resetViewOnce,
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'

export const TransactionOnboarding = ({
  icon,
  title,
  subtitle,
  buttonTitle,
  viewOnceKey,
  onPressNext
}: {
  icon: {
    component: React.FC<SvgProps>
    size?: number
  }
  title: string
  subtitle: string
  buttonTitle?: string
  viewOnceKey: ViewOnceKey
  onPressNext: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const { bottom } = useSafeAreaInsets()
  const dispatch = useDispatch()
  const shouldHideOnboarding = useSelector(selectHasBeenViewedOnce(viewOnceKey))

  const handleToggleShouldHide = useCallback(
    (value: boolean): void => {
      if (value) {
        dispatch(setViewOnce(viewOnceKey))
      } else {
        dispatch(resetViewOnce(viewOnceKey))
      }
    },
    [viewOnceKey, dispatch]
  )

  const groupListData = useMemo(() => {
    return [
      {
        title: 'Hide this screen next time',
        accessory: (
          <Toggle
            value={shouldHideOnboarding}
            onValueChange={handleToggleShouldHide}
          />
        )
      }
    ]
  }, [shouldHideOnboarding, handleToggleShouldHide])

  return (
    <View sx={{ flex: 1 }}>
      <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
        <View sx={{ marginTop: 50, alignItems: 'center' }}>
          {icon.component({
            width: icon.size ?? ICON_DEFAULT_SIZE,
            height: icon.size ?? ICON_DEFAULT_SIZE,
            color: theme.colors.$textPrimary
          })}
          <Text
            variant="heading3"
            sx={{ textAlign: 'center', marginTop: 24, lineHeight: 30 }}>
            {title}
          </Text>
          <Text variant="subtitle1" sx={{ textAlign: 'center', marginTop: 14 }}>
            {subtitle}
          </Text>
        </View>
      </ScrollView>
      <View sx={{ paddingHorizontal: 16, paddingBottom: bottom + 20, gap: 22 }}>
        <GroupList
          data={groupListData}
          titleSx={{ fontFamily: 'Inter-regular', fontSize: 15 }}
          textContainerSx={{
            paddingVertical: 4
          }}
        />
        <Button type="primary" size="large" onPress={onPressNext}>
          {buttonTitle ?? "Let's go!"}
        </Button>
      </View>
    </View>
  )
}

const ICON_DEFAULT_SIZE = 75
