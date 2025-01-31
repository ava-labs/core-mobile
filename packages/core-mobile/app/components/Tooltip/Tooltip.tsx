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
import AvaText from 'components/AvaText'
import { Popable, usePopable, PopableProps } from 'react-native-popable'
import { Row } from 'components/Row'
interface Props {
  iconColor?: string
  icon?: JSX.Element
  containerStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  isLabelPopable?: boolean
  children?: string | JSX.Element
}

export const Tooltip = ({
  content,
  children,
  icon,
  iconColor,
  position,
  backgroundColor,
  containerStyle,
  wrapperStyle,
  textStyle,
  caretPosition,
  isLabelPopable = false,
  hitslop = { left: 15, right: 15, top: 15, bottom: 15 },
  caretStyle,
  style
}: Props & Omit<PopableProps, 'children'>): JSX.Element => {
  const { theme } = useApplicationContext()
  const { ref, show, hide } = usePopable()

  const handleOnAction = (isVisible: boolean): void => {
    if (isVisible) {
      show()
    } else {
      hide()
    }
  }

  const renderLabel = (): JSX.Element | null => {
    if (children === undefined) {
      return null
    } else if (typeof children === 'string') {
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

  const renderPopable = (
    popableLabel: JSX.Element | string | null
  ): JSX.Element => {
    return (
      <Popable
        ref={ref}
        hitslop={hitslop}
        strictPosition
        onAction={handleOnAction}
        content={renderContent()}
        position={position}
        caretPosition={caretPosition}
        caretStyle={caretStyle}
        wrapperStyle={wrapperStyle}
        style={style}
        backgroundColor={backgroundColor ?? theme.neutral100}>
        {popableLabel}
      </Popable>
    )
  }

  const renderChildren = (): JSX.Element => {
    if (isLabelPopable && typeof children !== 'string') {
      return renderPopable(renderLabel())
    }
    return (
      <Row style={{ gap: 4, alignItems: 'center' }}>
        {renderLabel()}
        {renderPopable(icon ?? <InfoSVG color={iconColor} />)}
      </Row>
    )
  }

  return (
    <View style={containerStyle}>
      <Row
        style={{
          alignItems: 'center'
        }}>
        {renderChildren()}
      </Row>
    </View>
  )
}
