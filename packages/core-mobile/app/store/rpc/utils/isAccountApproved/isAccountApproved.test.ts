import { isAccountApproved } from './isAccountApproved'

describe('isAccountApproved', () => {
  it('should return true if address is approved', () => {
    const namespaces = {
      eip155: {
        accounts: [
          'eip155:43113:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
          'eip155:43114:0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
        ],
        methods: [
          'eth_sendTransaction',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
          'eth_signTypedData_v1',
          'eth_signTypedData',
          'eth_sign',
          'personal_sign',
          'wallet_addEthereumChain',
          'avalanche_getContacts',
          'avalanche_createContact',
          'avalanche_removeContact',
          'avalanche_updateContact',
          'avalanche_selectAccount',
          'avalanche_getAccounts'
        ],
        events: ['chainChanged', 'accountsChanged']
      }
    }

    const account = {
      addressC: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
      addressBTC: 'btcAddress1',
      addressAVM: 'avmAddress1',
      addressPVM: 'pvmAddress1',
      addressCoreEth: 'coreEthAddress1'
    }
    const result = isAccountApproved(account, 'eip155:43114', namespaces)

    expect(result).toEqual(true)
  })

  it('should return true if address is not approved', () => {
    const namespaces = {
      eip155: {
        accounts: [
          'eip155:43113:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
          'eip155:43114:0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
        ],
        methods: [
          'eth_sendTransaction',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
          'eth_signTypedData_v1',
          'eth_signTypedData',
          'eth_sign',
          'personal_sign',
          'wallet_addEthereumChain',
          'avalanche_getContacts',
          'avalanche_createContact',
          'avalanche_removeContact',
          'avalanche_updateContact',
          'avalanche_selectAccount',
          'avalanche_getAccounts'
        ],
        events: ['chainChanged', 'accountsChanged']
      }
    }

    const account = {
      addressC: '0x341b0073b66bfc19FCB54308861f604F5Eb8f51b',
      addressBTC: 'btcAddress1',
      addressAVM: 'avmAddress1',
      addressPVM: 'pvmAddress1',
      addressCoreEth: 'coreEthAddress1'
    }
    const result = isAccountApproved(account, 'eip155:43114', namespaces)

    expect(result).toEqual(false)
  })
})
