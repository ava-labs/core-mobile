import React, {
  FC,
  useEffect,
  useState,
  PropsWithChildren,
  ReactNode
} from 'react'
import { Animated, StyleProp, View, ViewStyle } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import Collapsible from 'react-native-collapsible'
import CarrotSVG from 'components/svg/CarrotSVG'
import AvaButton from 'components/AvaButton'

interface Props {
  title: React.ReactNode | string
  startExpanded?: boolean
  onExpandedChange?: (isExpanded: boolean) => void
  titleContainerStyle?: StyleProp<ViewStyle>
  collapsibleContainerStyle?: StyleProp<ViewStyle>
  renderChildrenCollapsed?: boolean
}

const CollapsibleSection: FC<Props & PropsWithChildren> = ({
  startExpanded = false,
  title,
  children,
  onExpandedChange,
  titleContainerStyle,
  collapsibleContainerStyle,
  renderChildrenCollapsed = false
}) => {
  const theme = useApplicationContext().theme
  const [expanded, setExpanded] = useState(startExpanded)
  const [startExp, setStartExp] = useState(startExpanded)

  useEffect(() => {
    if (startExp !== startExpanded) {
      setStartExp(startExpanded)
      setExpanded(startExpanded)
    }
  }, [startExp, startExpanded])

  useEffect(() => {
    onExpandedChange?.(expanded)
  }, [expanded, onExpandedChange])

  const getTitle = (): ReactNode => {
    return typeof title === 'string' ? (
      <Animated.View
        style={[
          {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 16,
            marginRight: 8,
            backgroundColor: theme.colorBg1
          },
          titleContainerStyle
        ]}>
        <AvaText.Body2>{title}</AvaText.Body2>
        <View
          style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}>
          <CarrotSVG color={theme.colorIcon4} />
        </View>
      </Animated.View>
    ) : (
      title
    )
  }

  function toggleExpanded(): void {
    setExpanded(!expanded)
  }
  return (
    <View>
      <AvaButton.Base onPress={toggleExpanded}>{getTitle()}</AvaButton.Base>
      <Collapsible
        style={[{ backgroundColor: theme.colorBg1 }, collapsibleContainerStyle]}
        renderChildrenCollapsed={renderChildrenCollapsed}
        collapsed={!expanded}>
        {children}
      </Collapsible>
    </View>
  )
}

export default CollapsibleSection
