import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors'
import { useEffect } from 'react'
import { useSharedValue, SharedValue } from 'react-native-reanimated'

export const useMotion = ({
  enabled
}: {
  enabled: boolean
}): SharedValue<DeviceMotionMeasurement | undefined> => {
  const deviceMotionMeasurement = useSharedValue<
    DeviceMotionMeasurement | undefined
  >(undefined)
  // subscribe to device motion
  useEffect(() => {
    const subscription = DeviceMotion.addListener(motion => {
      if (!enabled) {
        deviceMotionMeasurement.value = undefined
      }

      deviceMotionMeasurement.value = motion
    })

    return () => subscription && subscription.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return deviceMotionMeasurement
}
