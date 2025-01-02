import { Platform } from 'react-native'

// eslint-disable-next-line no-extend-native
if (Platform.OS === 'android) {
Array.prototype.toSorted = function () {
  return Array.from(this).sort()
}
}
