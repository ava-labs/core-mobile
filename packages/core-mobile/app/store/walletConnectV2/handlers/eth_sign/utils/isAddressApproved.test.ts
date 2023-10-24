import { isAddressApproved } from './isAddressApproved'

describe('isAddressApproved', () => {
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
          'wallet_switchEthereumChain',
          'avalanche_getContacts',
          'avalanche_createContact',
          'avalanche_removeContact',
          'avalanche_updateContact',
          'avalanche_selectAccount',
          'avalanche_getAccounts',
          'avalanche_bridgeAsset'
        ],
        events: ['chainChanged', 'accountsChanged']
      }
    }

    const address = 'eip155:43114:0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
    const result = isAddressApproved(address, namespaces)

    expect(result).toEqual(true)
  })

  it('should return false if address is missing chain ID', () => {
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
          'wallet_switchEthereumChain',
          'avalanche_getContacts',
          'avalanche_createContact',
          'avalanche_removeContact',
          'avalanche_updateContact',
          'avalanche_selectAccount',
          'avalanche_getAccounts',
          'avalanche_bridgeAsset'
        ],
        events: ['chainChanged', 'accountsChanged']
      }
    }

    const address = '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
    const result = isAddressApproved(address, namespaces)

    expect(result).toEqual(false)
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
          'wallet_switchEthereumChain',
          'avalanche_getContacts',
          'avalanche_createContact',
          'avalanche_removeContact',
          'avalanche_updateContact',
          'avalanche_selectAccount',
          'avalanche_getAccounts',
          'avalanche_bridgeAsset'
        ],
        events: ['chainChanged', 'accountsChanged']
      }
    }

    const address = 'eip155:43113:0x341b0073b66bfc19FCB54308861f604F5Eb8f51b'
    const result = isAddressApproved(address, namespaces)

    expect(result).toEqual(false)
  })
})
