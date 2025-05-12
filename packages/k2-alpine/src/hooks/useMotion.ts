import { useEffect, useMemo, useState } from 'react'
import { AppState, Platform } from 'react-native'
import {
  SharedValue,
  useAnimatedSensor,
  SensorType,
  ValueRotation,
  Value3D
} from 'react-native-reanimated'

export const useMotion = (): Motion | undefined => {
  const [appState, setAppState] = useState(AppState.currentState)
  const shouldAnimate = useMemo(() => appState === 'active', [appState])
  const rotation = useAnimatedSensor(SensorType.ROTATION)
  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    if (Platform.OS === 'android') {
      rotation.unregister()
      accelerometer.unregister()
    }
  }, [accelerometer, rotation])

  return shouldAnimate && Platform.OS !== 'android'
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
