import React, { useCallback, useEffect } from 'react'
import { LayoutChangeEvent, ViewStyle } from 'react-native'

import {
  Canvas,
  PaintStyle,
  Path,
  Skia,
  StrokeCap,
  TileMode,
  vec
} from '@shopify/react-native-skia'
import { useMemo, useState } from 'react'
import Svg, { Circle, Line } from 'react-native-svg'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  AnimatedStyle,
  DerivedValue,
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { View } from '../Primitives'
import { useTheme } from '../../hooks'
import { getYFromX, makeCurve } from '../../utils/chart'
import { alpha } from '../../utils'

export const StakeRewardChart = ({
  style,
  data,
  renderSelectionTitle,
  renderSelectionSubtitle,
  selectedIndex,
  initialIndex
}: {
  style?: ViewStyle
  data: { value: number; duration: string; index: number }[]
  renderSelectionTitle?: () => JSX.Element | undefined
  renderSelectionSubtitle?: () => JSX.Element | undefined
  selectedIndex: SharedValue<number | undefined>
  initialIndex?: number
}): JSX.Element => {
  const { theme } = useTheme()
  const [graphSize, setGraphSize] = useState<{
    width: number
    height: number
  }>({ width: 0, height: 0 })

  const path = useMemo(() => {
    const { path: curvedLine } = makeCurve({
      data: data.map((item, index) => ({ index, value: item.value })),
      size: graphSize,
      xPadding: GRAPH_STROKE_WIDTH,
      yPadding: GRAPH_STROKE_WIDTH
    })
    return curvedLine ? Skia.Path.MakeFromSVGString(curvedLine) : null
  }, [graphSize, data])

  const paint = useMemo(() => {
    const skiaColors = POSITIVE_GRADIENT_FILL_COLORS.map(color =>
      Skia.Color(color)
    )
    const gradientShader = Skia.Shader.MakeLinearGradient(
      vec(0, 0),
      vec(graphSize.width, graphSize.height),
      skiaColors,
      null,
      TileMode.Clamp
    )
    const newPaint = Skia.Paint()
    newPaint.setStyle(PaintStyle.Stroke)
    newPaint.setStrokeCap(StrokeCap.Round)
    newPaint.setStrokeWidth(GRAPH_STROKE_WIDTH)
    newPaint.setShader(gradientShader)
    return newPaint
  }, [graphSize])

  const gridWidth = graphSize.width / (data.length - 1)
  const selectionX = useSharedValue<number | undefined>(undefined)

  const selectIndex = useCallback(
    (index: number | undefined): void => {
      selectionX.value = index !== undefined ? gridWidth * index : undefined
    },
    [gridWidth, selectionX]
  )

  useAnimatedReaction(
    () => selectionX.value,
    x => {
      if (gridWidth === 0) return

      selectedIndex.value =
        x === undefined ? undefined : Math.round(x / gridWidth)
    }
  )

  useEffect(() => {
    selectIndex(initialIndex)
  }, [initialIndex, selectIndex])

  const {
    onLayout: onSelectionTitleLayout,
    animatedStyle: animatedTitleStyle
  } = useSelectionTitleLayoutAndStyle({
    selectionX,
    graphWidth: graphSize.width,
    horizontalInset: GESTURE_HORIZONTAL_INSET
  })

  const {
    onLayout: onSelectionSubtitleLayout,
    animatedStyle: animatedSubtitleStyle
  } = useSelectionTitleLayoutAndStyle({
    selectionX,
    graphWidth: graphSize.width,
    horizontalInset: GESTURE_HORIZONTAL_INSET
  })

  const gradientAreaPath = useMemo(() => {
    if (!path) return null

    const area = path.copy()
    const bottomY = graphSize.height

    const bounds = path.computeTightBounds()
    if (bounds) {
      area.lineTo(bounds.x + bounds.width, bottomY)
      area.lineTo(bounds.x, bottomY)
      area.close()
    }
    return area
  }, [path, graphSize.height])

  const gradientAreaPaint = useMemo(() => {
    const skiaColors = [
      '#3AC48599',
      alpha(theme.colors.$surfacePrimary, 0)
    ].map(color => Skia.Color(color))
    const gradientShader = Skia.Shader.MakeLinearGradient(
      vec(0, 0),
      vec(0, graphSize.height),
      skiaColors,
      null,
      TileMode.Clamp
    )
    const newPaint = Skia.Paint()
    newPaint.setStyle(PaintStyle.Fill)
    newPaint.setShader(gradientShader)
    return newPaint
  }, [graphSize, theme])

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.$surfaceSecondary,
          borderRadius: 12,
          paddingBottom: 15
        },
        style
      ]}>
      <View style={{ flexGrow: 1 }}>
        <View
          style={{
            paddingTop: 11,
            paddingBottom: 8,
            alignItems: 'flex-start'
          }}>
          {renderSelectionTitle && (
            <Animated.View
              style={animatedTitleStyle}
              onLayout={onSelectionTitleLayout}>
              {renderSelectionTitle()}
            </Animated.View>
          )}
          {renderSelectionSubtitle && (
            <Animated.View
              style={animatedSubtitleStyle}
              onLayout={onSelectionSubtitleLayout}>
              {renderSelectionSubtitle()}
            </Animated.View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{ flex: 1, marginBottom: 36, marginHorizontal: 36 }}
            onLayout={({ nativeEvent: { layout } }) =>
              setGraphSize({ width: layout.width, height: layout.height })
            }>
            <Canvas
              style={{ width: graphSize.width, height: graphSize.height }}>
              {gradientAreaPath && (
                <Path
                  style="fill"
                  path={gradientAreaPath}
                  paint={gradientAreaPaint}
                />
              )}
              {path && (
                <Path
                  style="stroke"
                  path={path}
                  strokeWidth={GRAPH_STROKE_WIDTH}
                  paint={paint}
                />
              )}
            </Canvas>
          </View>
          <Grid data={data} graphSize={graphSize} selectionX={selectionX} />
        </View>
      </View>
    </View>
  )
}

const Grid = ({
  data,
  graphSize,
  selectionX
}: {
  data: { index: number; value: number; duration: string }[]
  graphSize: { width: number; height: number }
  selectionX: SharedValue<number | undefined>
}): JSX.Element => {
  const [layout, setLayout] = useState<{ width: number; height: number }>()
  const handleLayout = (event: LayoutChangeEvent): void => {
    setLayout(event.nativeEvent.layout)
  }
  const width = layout?.width ?? 0
  const gridWidth = width / (data.length - 1)
  const selectionY = useSharedValue(0)

  const updateSelectionY = (x: number): void => {
    selectionY.value = getYFromX({
      x,
      data,
      size: graphSize,
      xPadding: GRAPH_STROKE_WIDTH,
      yPadding: GRAPH_STROKE_WIDTH
    })
  }

  const isInteracting = useSharedValue(false)

  const panGesture = Gesture.Pan()
    .onStart(event => {
      const x = clampSelectionX(event.x, width)
      selectionX.value = x
      isInteracting.value = true
    })
    .onUpdate(event => {
      selectionX.value = clampSelectionX(event.x, width)
    })
    .onEnd(event => {
      if (!gridWidth) return
      const x = clampSelectionX(event.x, width)
      const nearestIndex = Math.round(x / gridWidth)
      selectionX.value = withTiming(nearestIndex * gridWidth, {
        duration: 300,
        easing: Easing.inOut(Easing.cubic)
      })
      isInteracting.value = false
    })

  const selectedIndex = useDerivedValue(() => {
    if (!gridWidth || selectionX.value === undefined) return undefined

    return selectionX.value / gridWidth
  })

  useAnimatedReaction(
    () => selectionX.value,
    x => {
      if (x !== undefined) {
        // updateSelectionY should be called on the JS thread,
        // since getYFromX function can't be a worklet, as it uses d3 functions
        runOnJS(updateSelectionY)(x)
      }
    }
  )

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Animated.View
          style={{
            flex: 1,
            marginHorizontal: GESTURE_HORIZONTAL_INSET
          }}
          onLayout={handleLayout}>
          {data.map((item, index) => (
            <DashedLine
              key={index}
              label={item.duration}
              x={gridWidth * index}
              index={index}
              gridWidth={gridWidth}
              selectedIndex={selectedIndex}
              isInteracting={isInteracting}
              type={
                index === 0
                  ? 'first'
                  : index === data.length - 1
                  ? 'last'
                  : 'middle'
              }
            />
          ))}
          <SelectionIndicator x={selectionX} y={selectionY} />
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

const DashedLine = ({
  label,
  x,
  index,
  selectedIndex,
  isInteracting,
  gridWidth,
  type
}: {
  label: string
  x: number
  index: number
  selectedIndex: DerivedValue<number | undefined>
  isInteracting: SharedValue<boolean>
  gridWidth: number
  type: 'first' | 'last' | 'middle'
}): JSX.Element => {
  const { theme } = useTheme()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      color:
        selectedIndex.value === index
          ? theme.colors.$textPrimary
          : theme.colors.$textSecondary
    }
  })

  const selectionOverlayStyle = useAnimatedStyle(() => {
    const shouldShow =
      isInteracting.value &&
      selectedIndex.value !== undefined &&
      Math.round(selectedIndex.value) === index

    return {
      opacity: withTiming(shouldShow ? 1 : 0, { duration: 300 })
    }
  })

  const selectionBackgroundPadding = 10

  return (
    <View
      sx={{
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: x
      }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width:
              type === 'middle'
                ? gridWidth
                : gridWidth / 2 + selectionBackgroundPadding,
            top: 3,
            bottom: 28,
            left:
              type === 'middle'
                ? -gridWidth / 2 + SELECTION_INDICATOR_LINE_WIDTH / 2
                : type === 'first'
                ? -selectionBackgroundPadding
                : -gridWidth / 2 + SELECTION_INDICATOR_LINE_WIDTH / 2,
            backgroundColor: alpha(theme.colors.$textPrimary, 0.1),
            borderRadius: 12
          },
          selectionOverlayStyle
        ]}
      />
      <Svg style={{ flex: 1, width: 2, marginBottom: 25 }}>
        <Line
          x1="1"
          y1="100%"
          x2="1"
          y2="0"
          stroke={theme.colors.$borderPrimary}
          strokeWidth="2"
          strokeDasharray="0.3,4"
          strokeLinecap="round"
        />
      </Svg>
      <View
        sx={{
          position: 'absolute',
          left: -100,
          right: -100,
          bottom: 0,
          alignItems: 'center'
        }}>
        <Animated.Text
          style={[
            {
              fontFamily: 'Inter-Regular',
              fontSize: 11,
              lineHeight: 14
            },
            animatedStyle
          ]}>
          {label}
        </Animated.Text>
      </View>
    </View>
  )
}

export const SelectionIndicator = ({
  x,
  y
}: {
  x: SharedValue<number | undefined>
  y: SharedValue<number>
}): JSX.Element => {
  const { theme } = useTheme()
  const inset = SELECTION_INDICATOR_LINE_WIDTH / 2
  const [layout, setLayout] = useState<{ width: number; height: number }>()
  const handleLayout = (event: LayoutChangeEvent): void => {
    setLayout(event.nativeEvent.layout)
  }

  const animatedStyle = useAnimatedStyle(() => {
    if (x.value === undefined)
      return { opacity: withTiming(0, { duration: 300 }) }

    return { left: x.value, opacity: withTiming(1, { duration: 300 }) }
  })
  const dotAnimatedStyle = useAnimatedStyle(() => ({
    top:
      y.value -
      (SELECTION_INDICATOR_CIRCLE_RADIUS + SELECTION_INDICATOR_LINE_WIDTH)
  }))

  return (
    <Animated.View
      style={[
        {
          width: SELECTION_INDICATOR_LINE_WIDTH,
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          bottom: 25
        },
        animatedStyle
      ]}
      onLayout={handleLayout}>
      <Svg style={{ flex: 1, width: SELECTION_INDICATOR_LINE_WIDTH }}>
        <Line
          x1={inset}
          y1={(layout?.height ?? 0) - inset}
          x2={inset}
          y2={inset}
          stroke={theme.colors.$textPrimary}
          strokeWidth={SELECTION_INDICATOR_LINE_WIDTH}
          strokeLinecap="round"
        />
      </Svg>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width:
              (SELECTION_INDICATOR_CIRCLE_RADIUS +
                SELECTION_INDICATOR_LINE_WIDTH) *
              2,
            height:
              (SELECTION_INDICATOR_CIRCLE_RADIUS +
                SELECTION_INDICATOR_LINE_WIDTH) *
              2
          },
          dotAnimatedStyle
        ]}>
        <Svg>
          <Circle
            cx={
              SELECTION_INDICATOR_CIRCLE_RADIUS + SELECTION_INDICATOR_LINE_WIDTH
            }
            cy={
              SELECTION_INDICATOR_CIRCLE_RADIUS + SELECTION_INDICATOR_LINE_WIDTH
            }
            r={SELECTION_INDICATOR_CIRCLE_RADIUS}
            strokeWidth={SELECTION_INDICATOR_LINE_WIDTH}
            fill={theme.colors.$surfacePrimary}
            stroke={theme.colors.$textPrimary}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  )
}

const POSITIVE_COLOR_LEFT = '#1FC626'
const POSITIVE_COLOR_RIGHT = '#42C49F'

const POSITIVE_GRADIENT_FILL_COLORS = [
  POSITIVE_COLOR_LEFT,
  POSITIVE_COLOR_RIGHT
]

const SELECTION_INDICATOR_LINE_WIDTH = 3
const SELECTION_INDICATOR_CIRCLE_RADIUS = 8

const GRAPH_STROKE_WIDTH = 3
const GESTURE_HORIZONTAL_INSET = 36 + GRAPH_STROKE_WIDTH

const useSelectionTitleLayoutAndStyle = ({
  selectionX,
  graphWidth,
  horizontalInset,
  marginHorizontal = 12
}: {
  selectionX: SharedValue<number | undefined>
  graphWidth: number
  horizontalInset: number
  marginHorizontal?: number
}): {
  onLayout: (event: LayoutChangeEvent) => void
  animatedStyle: AnimatedStyle<ViewStyle>
} => {
  const [layout, setLayout] = useState<
    { width: number; height: number } | undefined
  >(undefined)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setLayout(event.nativeEvent.layout)
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    if (selectionX.value === undefined)
      return { opacity: withTiming(0, { duration: 300 }) }

    const componentWidth = layout?.width ?? 0
    const translateX = Math.min(
      Math.max(
        selectionX.value + horizontalInset - componentWidth / 2,
        marginHorizontal
      ),
      graphWidth - componentWidth + horizontalInset + marginHorizontal
    )
    return {
      transform: [{ translateX }],
      opacity: withTiming(1, { duration: 300 })
    }
  }, [layout, graphWidth, selectionX])

  return { onLayout, animatedStyle }
}

const clampSelectionX = (x: number, maxWidth: number): number => {
  'worklet'
  return Math.min(Math.max(x - GESTURE_HORIZONTAL_INSET, 0), maxWidth)
}
