import { useEffect, useState } from 'react'
import Clipboard from '@react-native-clipboard/clipboard'

export default function useClipboardWatcher(): string {
  const [clipboard, setClipboard] = useState('')

  useEffect(() => {
    Clipboard.addListener(async () => {
      const clipboardString = await Clipboard.getString()
      setClipboard(clipboardString)
    })
    return () => {
      Clipboard.removeAllListeners()
    }
  }, [])

  return clipboard
}
