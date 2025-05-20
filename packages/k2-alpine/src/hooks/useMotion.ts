import { useEffect, useMemo, useState } from 'react'
import { AppState, Platform } from 'react-native'
import {
  SharedValue,
  useAnimatedSensor,
  SensorType,
  ValueRotation,
  Value3D
} from 'react-native-reanimated'

export const useMotion = (isActive: boolean): Motion | undefined => {
  const [appState, setAppState] = useState(AppState.currentState)
  const shouldAnimate = useMemo(
    () => appState === 'active' && isActive && Platform.OS === 'ios',
    [appState, isActive]
  )
  const rotation = useAnimatedSensor(SensorType.ROTATION, shouldAnimate)
  const accelerometer = useAnimatedSensor(
    SensorType.ACCELEROMETER,
    shouldAnimate
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    if (!shouldAnimate) {
      rotation.unregister()
      accelerometer.unregister()
    }
  }, [accelerometer, rotation, shouldAnimate, isActive])

  return shouldAnimate
    ? {
        rotation: rotation.sensor,
        accelerometer: accelerometer.sensor
      }
    : undefined
}

export type Motion = {
  rotation: SharedValue<ValueRotation>
  accelerometer: SharedValue<Value3D>
}
