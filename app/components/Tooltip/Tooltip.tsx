import React, { useCallback, useEffect, useState } from 'react'
import { PopableContent } from 'components/PopableContent'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  AppState,
  AppStateStatus,
  Pressable,
  StyleProp,
  View,
  ViewStyle
} from 'react-native'
import InfoSVG from 'components/svg/InfoSVG'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { Popable, usePopable, PopableProps } from '../popover'

interface Props {
  iconColor?: string
  icon?: JSX.Element
  containerStyle?: StyleProp<ViewStyle>
}

export const Tooltip = ({
  content,
  children,
  icon,
  iconColor,
  position,
  backgroundColor,
  containerStyle,
  style
}: Props & PopableProps): JSX.Element => {
  const { theme } = useApplicationContext()
  const { ref, show, hide } = usePopable()
  const [visible, setVisible] = useState(false)

  const handleOnPress = (): void => {
    if (visible) {
      hide()
      setVisible(false)
    } else {
      show()
      setVisible(true)
    }
  }

  const handleOnAction = (isVisible: boolean): void => {
    if (isVisible) {
      show()
      setVisible(true)
    } else {
      hide()
      setVisible(false)
    }
  }

  const renderChildren = (): JSX.Element => {
    if (children && typeof children === 'string') {
      return <AvaText.Body2 color={theme.colorText1}>{children}</AvaText.Body2>
    }
    return children as JSX.Element
  }

  const onAppStateChange = useCallback(
    (status: AppStateStatus): void => {
      if (status === 'inactive') {
        hide()
        setVisible(false)
      }
    },
    [hide]
  )

  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange)
    return () => {
      sub.remove()
    }
  }, [onAppStateChange])

  const renderContent = (): JSX.Element => {
    if (content && typeof content === 'string') {
      return <PopableContent message={content} />
    }
    return content as JSX.Element
  }

  return (
    <View style={containerStyle}>
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}
        onPress={handleOnPress}>
        {renderChildren()}
        <Space x={4} />
        <Popable
          ref={ref}
          onAction={handleOnAction}
          content={renderContent()}
          position={position}
          style={style}
          backgroundColor={backgroundColor ?? theme.neutral100}>
          {icon ?? <InfoSVG color={iconColor} />}
        </Popable>
      </Pressable>
    </View>
  )
}
