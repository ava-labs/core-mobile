// there seems to be a performance issue with React Native's promise so we are polyfilling it with es6-promise
const {
  polyfillGlobal
} = require('react-native/Libraries/Utilities/PolyfillFunctions')

const Promise = require('es6-promise').Promise

// es6-promise doesn't have allSettled by default
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

polyfillGlobal('Promise', () => Promise)
