import { isAccountApproved, isAddressApproved } from './isAccountApproved'

describe('isAddressApproved', () => {
  const namespaces = {
    eip155: {
      accounts: [
        'eip155:43113:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
        'eip155:43114:0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
      ],
      methods: ['eth_sendTransaction'],
      events: ['chainChanged', 'accountsChanged']
    },
    solana: {
      accounts: [
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW'
      ],
      methods: ['solana_signTransaction'],
      events: []
    }
  }

  it('returns true when the address is granted in the namespace', () => {
    expect(
      isAddressApproved(
        '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
        'eip155:43114',
        namespaces
      )
    ).toBe(true)
  })

  it('matches addresses granted under another chain of the same namespace', () => {
    expect(
      isAddressApproved(
        '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
        'eip155:43114',
        namespaces
      )
    ).toBe(true)
  })

  it('matches EVM addresses case-insensitively (EIP-55 checksum casing)', () => {
    expect(
      isAddressApproved(
        '0xca0e993876152cca6053eedfc753092c8ce712d0',
        'eip155:43114',
        namespaces
      )
    ).toBe(true)
  })

  it('returns false when the address is not granted', () => {
    expect(
      isAddressApproved(
        '0x341b0073b66bfc19FCB54308861f604F5Eb8f51b',
        'eip155:43114',
        namespaces
      )
    ).toBe(false)
  })

  it('returns true for a granted Solana account', () => {
    expect(
      isAddressApproved(
        '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        namespaces
      )
    ).toBe(true)
  })

  it('returns false for a Solana account that was never granted', () => {
    expect(
      isAddressApproved(
        '4Nd1mYQZ6X8jY6nWn6iVrDpcLzJq9z2NKV1S1nGiqNz1',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        namespaces
      )
    ).toBe(false)
  })

  it('returns false for a case variant of a granted Solana account (base58 is case-sensitive)', () => {
    expect(
      isAddressApproved(
        '9gqmz7fttgv5hvscrr9qqt6spbs7i4cklddj4tuae3sw',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        namespaces
      )
    ).toBe(false)
  })

  it('returns false when the session has no namespace for the chain', () => {
    expect(
      isAddressApproved(
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        'bip122:000000000019d6689c085ae165831e93',
        namespaces
      )
    ).toBe(false)
  })
})

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
      addressCoreEth: 'coreEthAddress1',
      addressSVM: 'svmAddress1'
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
      addressCoreEth: 'coreEthAddress1',
      addressSVM: 'svmAddress1'
    }
    const result = isAccountApproved(account, 'eip155:43114', namespaces)

    expect(result).toEqual(false)
  })
})
