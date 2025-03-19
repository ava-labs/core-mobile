import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors'
import { useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import { useSharedValue, SharedValue } from 'react-native-reanimated'

export const useMotion = (): SharedValue<
  DeviceMotionMeasurement | undefined
> => {
  const [appState, setAppState] = useState(AppState.currentState)
  const deviceMotionMeasurement = useSharedValue<
    DeviceMotionMeasurement | undefined
  >(undefined)

  const shouldAnimate = useMemo(() => appState === 'active', [appState])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  // subscribe to device motion
  useEffect(() => {
    const subscription = DeviceMotion.addListener(motion => {
      if (shouldAnimate) {
        deviceMotionMeasurement.value = motion
      } else {
        deviceMotionMeasurement.value = undefined
      }
    })

    return () => subscription && subscription.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAnimate])

  return deviceMotionMeasurement
}
