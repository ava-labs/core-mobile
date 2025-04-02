import { install } from 'react-native-quick-crypto'

// this will make both buffer (from @craftzdog/react-native-buffer)
// and crypto (from react-native-quick-crypto) available globally
install()

// react-native-quick-crypto only has partial support for subtle
// we need to delete it from the global object so that
// react-native-webview-crypto can pollyfill it on demand
// (for example, when exporting seed phrase)
delete global.crypto.subtle
