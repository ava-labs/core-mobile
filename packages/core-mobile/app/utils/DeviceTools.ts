import Clipboard from '@react-native-clipboard/clipboard'
import { ShowSnackBar } from 'components/Snackbar'

export const copyToClipboard = (str?: string): void => {
  if (str) {
    Clipboard.setString(str)
    ShowSnackBar('Copied')
  } else {
    Clipboard.setString('') //better to clean clipboard than let user paste something unintentionally
  }
}
