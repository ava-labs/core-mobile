// Use Node's crypto when running in Jest
const crypto = require('crypto')

// Attach to global
global.crypto = {
  ...crypto
}
