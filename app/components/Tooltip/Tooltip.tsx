import React, { useCallback, useEffect } from 'react'
import { PopableContent } from 'components/PopableContent'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  AppState,
  AppStateStatus,
  StyleProp,
  TextStyle,
  View,
  ViewStyle
} from 'react-native'
import InfoSVG from 'components/svg/InfoSVG'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { Popable, usePopable, PopableProps } from 'react-native-popable'
import { Row } from 'components/Row'
interface Props {
  iconColor?: string
  icon?: JSX.Element
  containerStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const Tooltip = ({
  content,
  children,
  icon,
  iconColor,
  position,
  backgroundColor,
  containerStyle,
  textStyle,
  hitslop = { left: 15, right: 15, top: 15, bottom: 15 },
  style
}: Props & PopableProps): JSX.Element => {
  const { theme } = useApplicationContext()
  const { ref, show, hide } = usePopable()

  const handleOnAction = (isVisible: boolean): void => {
    if (isVisible) {
      show()
    } else {
      hide()
    }
  }

  const renderChildren = (): JSX.Element => {
    if (children && typeof children === 'string') {
      return (
        <AvaText.Body2 textStyle={textStyle} color={theme.colorText1}>
          {children}
        </AvaText.Body2>
      )
    }
    return children
  }

  const onAppStateChange = useCallback(
    (status: AppStateStatus): void => {
      if (status === 'inactive') {
        hide()
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

  const renderContent = (): string | JSX.Element => {
    if (content && typeof content === 'string') {
      return <PopableContent message={content} />
    }
    return content
  }

  return (
    <View style={containerStyle}>
      <Row
        style={{
          alignItems: 'center'
        }}>
        {renderChildren()}
        <Space x={4} />
        <Popable
          ref={ref}
          hitslop={hitslop}
          strictPosition
          onAction={handleOnAction}
          content={renderContent()}
          position={position}
          style={style}
          backgroundColor={backgroundColor ?? theme.neutral100}>
          {icon ?? <InfoSVG color={iconColor} />}
        </Popable>
      </Row>
    </View>
  )
}
