import {
  SharedValue,
  useAnimatedSensor,
  SensorType,
  ValueRotation,
  Value3D
} from 'react-native-reanimated'

export const useMotion = (isActive: boolean): Motion | undefined => {
  const rotation = useAnimatedSensor(SensorType.ROTATION, isActive)
  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, isActive)

  return isActive
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
