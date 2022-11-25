import { avalancheGetAccountsHandler } from './avalanche_getAccounts'
import { avalancheGetContactsHandler } from './avalanche_getContacts'
import { ethSendTransactionHandler } from './eth_sendTransaction'
import { ethSignHandler } from './eth_sign'
import { sessionRequestHandler } from './session_request'

const handlerMap = [
  avalancheGetAccountsHandler,
  avalancheGetContactsHandler,
  ethSendTransactionHandler,
  ethSignHandler,
  sessionRequestHandler
].reduce((acc, current) => {
  current.methods.forEach(method => {
    acc.set(method, current)
  })
  return acc
}, new Map())

export default handlerMap
