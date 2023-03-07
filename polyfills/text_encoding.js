// inspired by https://github.com/expo/browser-polyfill
// and https://github.com/acostalima/react-native-polyfill-globals
import { TextDecoder, TextEncoder } from 'text-encoding'

global.TextDecoder = global.TextDecoder || TextDecoder
global.TextEncoder = global.TextEncoder || TextEncoder
