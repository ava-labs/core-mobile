export default [
  {
    relay: {
      protocol: 'irn'
    },
    namespaces: {
      eip155: {
        accounts: ['eip155:43113:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318'],
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
    },
    optionalNamespaces: {},
    requiredNamespaces: {
      eip155: {
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
        chains: ['eip155:43113'],
        events: ['chainChanged', 'accountsChanged']
      }
    },
    controller:
      'b9be2434be130743ceac605609101209325144585eea617c1bc56bc1d2821c2c',
    expiry: 1677971173,
    pairingTopic:
      '3c74583111ab5e006b03cbb0f252c667686e9fc01e675dff90aa8b18ec435feb',
    topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
    acknowledged: true,
    self: {
      publicKey:
        'b9be2434be130743ceac605609101209325144585eea617c1bc56bc1d2821c2c',
      metadata: {
        name: 'Core',
        description: 'Core Mobile',
        url: 'https://www.avax.network',
        icons: [
          'https://assets.website-files.com/5fec984ac113c1d4eec8f1ef/62602f568fb4677b559827e5_core.jpg'
        ]
      }
    },
    peer: {
      publicKey:
        '80b48d41c724268dc892be007476a867c02bf1f390e3ccab03a981945afdb841',
      metadata: {
        description: '',
        url: 'http://127.0.0.1:5173',
        icons: [],
        name: 'Playground'
      }
    }
  },
  {
    relay: {
      protocol: 'irn'
    },
    namespaces: {
      eip155: {
        accounts: ['eip155:43114:0xcA0E993876152ccA6053eeDFC753092c8cE712D0'],
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
    },
    optionalNamespaces: {},
    requiredNamespaces: {
      eip155: {
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
        chains: ['eip155:43114'],
        events: ['chainChanged', 'accountsChanged']
      }
    },
    controller:
      'b9be2434be130743ceac605609101209325144585eea617c1bc56bc1d2821c2c',
    expiry: 1677971173,
    pairingTopic:
      '4d74583111ab5e006b03cbb0f252c667686e9fc01e675dff90aa8b18ec435feb',
    topic: 'b9be2434be130743ceac605609101209325144585eea617c1bc56bc1d2821c2c',
    acknowledged: true,
    self: {
      publicKey:
        'b9be2434be130743ceac605609101209325144585eea617c1bc56bc1d2821c2c',
      metadata: {
        name: 'Core',
        description: 'Core Mobile',
        url: 'https://www.avax.network',
        icons: [
          'https://assets.website-files.com/5fec984ac113c1d4eec8f1ef/62602f568fb4677b559827e5_core.jpg'
        ]
      }
    },
    peer: {
      publicKey:
        '80b48d41c724268dc892be007476a867c02bf1f390e3ccab03a981945afdb841',
      metadata: {
        description: '',
        url: 'http://127.0.0.1:5173',
        icons: [],
        name: 'Playground'
      }
    }
  }
]
