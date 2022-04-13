import React, {
  FC,
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'

interface ConfirmationTrackerProps {
  started: boolean
  requiredCount: number
  currentCount: number
  className?: string
}

const ConfirmationTracker: FC<ConfirmationTrackerProps> = ({
  started,
  requiredCount,
  currentCount,
  ...rest
}) => {
  const theme = useContext(ApplicationContext).theme
  const numberOfDots = requiredCount - 1
  const containerRef = useRef<View>(null)
  const moveAnim = useRef(new Animated.Value(0)).current
  const dot1Anim = useRef(new Animated.Value(0)).current
  const dot2Anim = useRef(new Animated.Value(0)).current
  const dot3Anim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1.5)).current

  useEffect(() => {
    pulse()
  }, [])

  const calculateLineWidth = (fullWidth = false) => {
    const containerWidth = 400
    if (fullWidth) {
      return containerWidth
    }
    return (containerWidth - 4 * 20) / 3
  }

  const moveBatch = (left: number) => {
    Animated.timing(moveAnim, {
      toValue: left,
      duration: 600,
      useNativeDriver: true
    }).start()
  }

  const move = (value: Animated.Value, delay = 0, fullWidth = false) => {
    Animated.loop(
      // runs given animations in a sequence
      Animated.sequence([
        Animated.timing(value, {
          toValue: calculateLineWidth(fullWidth),
          duration: fullWidth ? 2500 : 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.linear),
          delay: delay
        })
      ])
    ).start()
  }

  const pulse = () => {
    Animated.loop(
      // runs given animations in a sequence
      Animated.sequence([
        // increase size
        Animated.timing(pulseAnim, {
          toValue: 100,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ])
    ).start()
  }

  function renderDot(value: Animated.Value, delay = 0, fullWidth = false) {
    move(value, delay, fullWidth)
    return (
      <Animated.View
        style={{
          width: 6,
          height: 6,
          backgroundColor: theme.colorText1,
          borderRadius: 50,
          position: 'absolute',
          top: -2,
          zIndex: 5000,
          transform: [{ translateX: value }]
        }}
      />
    )
  }

  function renderDashedLine() {
    return (
      <View
        style={{
          width: 40,
          height: 0,
          backgroundColor: theme.colorBg3,
          borderStyle: 'dashed',
          borderWidth: 1,
          borderColor: theme.background,
          alignSelf: 'center'
        }}
      />
    )
  }

  function renderCircle(complete: boolean, active: boolean) {
    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colorBg2
        }}>
        <Animated.View
          style={[
            {
              borderWidth: 3,
              borderColor: theme.colorText1,
              borderRadius: 50,
              width: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 5,
              backgroundColor: complete ? theme.colorBg3 : theme.transparent,
              padding: 0
            }
          ]}
        />
        {active && (
          <Animated.View
            style={{
              width: 20,
              height: 20,
              borderRadius: 50,
              backgroundColor: theme.colorBg3,
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [5, 50, 100],
                    outputRange: [1, 2, 1]
                  })
                }
              ],
              position: 'absolute'
            }}
          />
        )}
      </View>
    )
  }

  function renderLine(complete: boolean, active: boolean, grow = false) {
    return (
      <View
        style={[
          {
            width: calculateLineWidth(grow),
            height: 2,
            marginTop: 9,
            zIndex: -1,
            backgroundColor: active || complete ? theme.white : theme.colorBg3
          },
          grow && { width: '100%' }
        ]}>
        {active && (
          <>
            {renderDot(dot1Anim, 0, grow)}
            {renderDot(dot2Anim, 450, grow)}
            {renderDot(dot3Anim, 900, grow)}
          </>
        )}
      </View>
    )
  }

  const confirmations = useMemo(() => {
    const dots = []
    for (let i = 1; i <= numberOfDots; i++) {
      const active = started && currentCount < i && currentCount >= i - 1
      dots.push(
        <Fragment key={`container-${i}`}>
          {renderLine(currentCount >= i, active)}
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            {renderCircle(currentCount >= i, active)}
            <AvaText.Body1 textStyle={{ marginTop: 10, marginHorizontal: -16 }}>
              {i}/{requiredCount}
            </AvaText.Body1>
          </View>
        </Fragment>
      )
    }
    return dots
  }, [currentCount])

  const lastStepActive =
    started && currentCount < requiredCount && currentCount >= numberOfDots
  const showBreakEnd = currentCount < requiredCount - 2 && requiredCount > 3

  const renderStartCircle = useMemo(
    () => (
      <View
        style={{
          alignItems: 'flex-start',
          zIndex: 1,
          paddingTop: 8,
          justifyContent: 'center'
        }}>
        <View style={{ flexDirection: 'row' }}>
          {renderCircle(started, false)}
          {currentCount > 1 && renderDashedLine()}
        </View>
        <AvaText.Body1
          textStyle={{ marginTop: 10, backgroundColor: theme.colorBg2 }}>
          Start
        </AvaText.Body1>
      </View>
    ),
    [currentCount]
  )

  const renderFinalCircle = useMemo(
    () => (
      <View
        style={{
          alignItems: 'flex-end',
          zIndex: 1,
          paddingTop: 8,
          justifyContent: 'center'
        }}>
        <View style={{ flexDirection: 'row-reverse' }}>
          {renderCircle(currentCount >= requiredCount, lastStepActive)}
          {showBreakEnd && renderDashedLine()}
        </View>
        <AvaText.Body1
          textStyle={{ marginTop: 10, backgroundColor: theme.colorBg2 }}>
          Final
        </AvaText.Body1>
      </View>
    ),
    [currentCount, requiredCount, lastStepActive, showBreakEnd]
  )

  const renderSingleLine = useMemo(
    () => (
      <Animated.View
        style={{
          flex: 1,
          position: 'absolute',
          overflow: 'hidden',
          top: 12,
          bottom: 0,
          left: 0,
          right: 12
        }}>
        {renderLine(currentCount >= requiredCount, lastStepActive, true)}
      </Animated.View>
    ),
    [currentCount, requiredCount, lastStepActive]
  )

  let left = 0
  if (currentCount > 1) {
    if (!showBreakEnd) {
      left = -(calculateLineWidth() + 20) * (requiredCount - 3)
    } else {
      left = -(calculateLineWidth() + 20) * (currentCount - 1)
    }
  }

  if (requiredCount !== 1) {
    moveBatch(left)
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colorBg2 }]}
      ref={containerRef}
      {...rest}>
      {renderStartCircle}
      {requiredCount === 1 ? (
        renderSingleLine
      ) : (
        <View
          style={{
            overflow: 'hidden',
            position: 'absolute'
          }}>
          <Animated.View
            style={{
              flexDirection: 'row',
              paddingTop: 12,
              flex: 1,
              paddingRight: 100,
              transform: [
                {
                  translateX: moveAnim
                }
              ]
            }}>
            {confirmations}
            {renderLine(
              currentCount >= requiredCount,
              lastStepActive,
              requiredCount === 1
            )}
          </Animated.View>
        </View>
      )}
      {renderFinalCircle}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    minWidth: 311,
    maxWidth: '100%',
    flexDirection: 'row',
    overflow: 'hidden',
    paddingTop: 4
  }
})

export default ConfirmationTracker
