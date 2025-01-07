import Clipboard from '@react-native-clipboard/clipboard'
import { showSnackbar } from './toast'

export const copyToClipboard = (str?: string, message = 'Copied'): void => {
  if (str) {
    Clipboard.setString(str)
    showSnackbar(message)
  } else {
    Clipboard.setString('') //better to clean clipboard than let user paste something unintentionally
  }
}
