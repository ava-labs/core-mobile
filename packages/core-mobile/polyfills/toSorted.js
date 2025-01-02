import { Platform } from 'react-native'

if (Platform.OS === 'android') {
  // eslint-disable-next-line no-extend-native
  Array.prototype.toSorted = function () {
    return Array.from(this).sort()
  }
}
