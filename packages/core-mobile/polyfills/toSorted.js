import { Platform } from 'react-native'

// eslint-disable-next-line no-extend-native
Array.prototype.toSorted = function () {
  return Platform.OS === 'ios' ? this : Array.from(this).sort()
}
