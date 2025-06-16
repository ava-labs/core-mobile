import {
  Button,
  GroupList,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useCallback, useMemo, useState } from 'react'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import { resetViewOnce, setViewOnce, ViewOnceKey } from 'store/viewOnce'
import { ScrollScreen } from './ScrollScreen'

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
  const dispatch = useDispatch()
  const [hide, setHide] = useState(true)

  const handlePressNext = useCallback(() => {
    if (hide) {
      dispatch(setViewOnce(viewOnceKey))
    } else {
      dispatch(resetViewOnce(viewOnceKey))
    }
    onPressNext()
  }, [dispatch, hide, onPressNext, viewOnceKey])

  const groupListData = useMemo(() => {
    return [
      {
        title: 'Hide this screen next time',
        accessory: <Toggle value={hide} onValueChange={setHide} />
      }
    ]
  }, [hide, setHide])

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 20 }}>
        <GroupList
          data={groupListData}
          titleSx={{ fontFamily: 'Inter-regular', fontSize: 15 }}
          textContainerSx={{
            paddingVertical: 4
          }}
        />
        <Button
          type="primary"
          size="large"
          onPress={handlePressNext}
          testID="transaction_onboarding__next">
          {buttonTitle ?? "Let's go!"}
        </Button>
      </View>
    )
  }, [groupListData, handlePressNext, buttonTitle])

  return (
    <ScrollScreen
      isModal
      scrollEnabled={false}
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16
      }}>
      <View sx={{ marginTop: 50, alignItems: 'center' }}>
        {icon.component({
          width: icon.size ?? ICON_DEFAULT_SIZE,
          height: icon.size ?? ICON_DEFAULT_SIZE,
          color: theme.colors.$textPrimary
        })}
        <Text
          variant="heading3"
          sx={{
            textAlign: 'center',
            marginTop: 24,
            lineHeight: 30,
            maxWidth: 300
          }}>
          {title}
        </Text>
        <Text
          variant="subtitle1"
          sx={{ textAlign: 'center', marginTop: 14, maxWidth: 320 }}>
          {subtitle}
        </Text>
      </View>
    </ScrollScreen>
  )
}

const ICON_DEFAULT_SIZE = 75
