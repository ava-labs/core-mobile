import { Alert } from 'react-native'

// utility to await an alert dismissal
export const showResult = (title, message) =>
  new Promise(resolve => {
    Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve() }])
  })
