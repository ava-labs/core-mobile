import 'react-native-gesture-handler'
import 'react-native-quick-crypto' // to override the global.crypto object
import '@walletconnect/react-native-compat'
import 'react-native-url-polyfill/auto'
import '../shim'
import './read_as_array_buffer_shim'
import './text_encoding'
import './base64_shim'
import './bigInt_to_string'
import './ethers'

// setTimeout(() => {
//   const OriginalPromise = Promise

//   // Override the Promise object
//   class FakePromise extends OriginalPromise {
//     constructor() {
//       super(resolve => {
//         resolve()
//         // // Immediately reject
//         // reject(new Error('Promise rejected immediately'))
//       })
//     }
//   }

//   // Assign the overridden Promise globally
//   window.Promise = FakePromise // If running in a browser

//   global.Promise = FakePromise // If running in Node.js
// }, 7000)

const Promise = require('es6-promise').Promise

Promise.allSettled =
  Promise.allSettled ||
  (promises =>
    Promise.all(
      promises.map(p =>
        p
          .then(value => ({
            status: 'fulfilled',
            value
          }))
          .catch(reason => ({
            status: 'rejected',
            reason
          }))
      )
    ))

const {
  polyfillGlobal
} = require('react-native/Libraries/Utilities/PolyfillFunctions')

polyfillGlobal('Promise', () => Promise)

// eslint-disable-next-line no-alert
alert('polyfill Promise done')
