import {
  SharedValue,
  useAnimatedSensor,
  SensorType,
  ValueRotation,
  Value3D
} from 'react-native-reanimated'

export const useMotion = (isEnabled: boolean): Motion | undefined => {
  const rotation = useAnimatedSensor(SensorType.ROTATION, isEnabled)
  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, isEnabled)

  return isEnabled
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
