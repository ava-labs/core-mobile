import { Alert } from 'react-native'
import { copyToClipboard } from '../app/new/common/utils/clipboard'

// utility to await an alert dismissal
export const showResult = (title, message) =>
  new Promise(resolve => {
    Alert.alert(title, message, [
      {
        text: 'Copy Results',
        onPress: () => {
          copyToClipboard(message)
          resolve()
        }
      },
      { text: 'OK', onPress: () => resolve() }
    ])
  })
