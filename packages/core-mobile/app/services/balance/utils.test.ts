import { mapRawBalanceToOld } from './utils'

// describe('getLocalTokenId', () => {
//   it('returns the token address if it exists', () => {
//     const token = { address: '0x123', name: 'name', symbol: 'symbol' } as
//       | TokenWithBalance
//       | NetworkContractToken
//     expect(getLocalTokenId(token)).toBe('0x123')
//   })
//   it('returns the token type and symbol if address does not exist', () => {
//     const token = { type: TokenType.NATIVE, symbol: 'symbol' } as
//       | TokenWithBalance
//       | NetworkContractToken
//     expect(getLocalTokenId(token)).toBe('NATIVE-symbol')
//   })
// })

describe('mapNewToOld', () => {
  it('converts new balance to old format', () => {
    const newBalance = {
      caip2Id: 'eip155:43114',
      networkType: 'evm',
      id: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
      balances: {
        nativeTokenBalance: {
          name: 'Avalanche',
          symbol: 'AVAX',
          type: 'native',
          decimals: 18,
          balance: '866649536412088689',
          internalId: 'NATIVE-avax',
          price: 13.65,
          priceChange24h: 0.983416,
          priceChangePercentage24h: 7.76611,
          balanceInCurrency: 11.8297725,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg'
        },
        erc20TokenBalances: [
          {
            name: '0x Protocol Token',
            symbol: 'ZRX.e',
            type: 'erc20',
            decimals: 18,
            balance: '660552832539',
            address: '0x596fa47043f99a4e0f122243b841e55375cde0d2',
            internalId: 'eip155:1-0xe41d2489571d322189246dafa5ebde1f4699f498',
            price: 0.153756,
            priceChange24h: 0.0095051,
            priceChangePercentage24h: 6.58927,
            balanceInCurrency: 0,
            logoUri:
              'https://coin-images.coingecko.com/coins/images/863/large/0x.png?1696501996',
            scanResult: 'Benign'
          },
          {
            name: 'Aave USDC',
            symbol: 'ausdc',
            type: 'erc20',
            decimals: 6,
            balance: '50812',
            address: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
            internalId: 'eip155:1-0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c',
            price: 0.999855,
            priceChange24h: 0.00004479,
            priceChangePercentage24h: 0.00448,
            balanceInCurrency: 0.050802632550000004,
            logoUri:
              'https://coin-images.coingecko.com/coins/images/32847/large/usdc_%281%29.png?1699619355',
            scanResult: 'Benign'
          },
          {
            name: 'Aave v3 WAVAX',
            symbol: 'AWAVAX',
            type: 'erc20',
            decimals: 18,
            balance: '100444874563392434',
            address: '0x6d80113e533a2c0fe82eabd35f1875dcea89ea97',
            internalId:
              'eip155:43114-0x6d80113e533a2c0fe82eabd35f1875dcea89ea97',
            price: 12.91,
            balanceInCurrency: 1.2966804,
            logoUri:
              'https://assets.coingecko.com/coins/images/32915/small/wavax.png?1699824961',
            scanResult: 'Benign'
          },
          {
            name: 'USDC',
            symbol: 'USDC',
            type: 'erc20',
            decimals: 6,
            balance: '45339784',
            address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
            internalId: 'eip155:1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            price: 0.999805,
            priceChange24h: 0.00000489,
            priceChangePercentage24h: 0.00049,
            balanceInCurrency: 45.3309387429,
            logoUri:
              'https://images.ctfassets.net/gcj8jwzm6086/28svJFwz3VVA451Hd2S8q2/5051e2f7261b9c14ba75486f679ab90f/usdc.png',
            scanResult: 'Benign'
          },
          {
            name: 'KET',
            symbol: 'KET',
            type: 'erc20',
            decimals: 18,
            balance: '186491496199324741498',
            address: '0xffff003a6bad9b743d658048742935fffe2b6ed7',
            internalId:
              'eip155:43114-0xffff003a6bad9b743d658048742935fffe2b6ed7',
            price: 0.01249897,
            priceChange24h: 0.00083626,
            priceChangePercentage24h: 7.17033,
            balanceInCurrency: 2.330951663755,
            logoUri:
              'https://images.ctfassets.net/gcj8jwzm6086/3DftNW5gEz59nc11jwiFiX/7e86ead1a43ee037a011e0050fa57cbb/v6h9FFO5_400x400.jpg',
            scanResult: 'Benign'
          }
        ],
        totalBalanceInCurrency: 60.83914593920501
      },
      error: null
    }
    const oldBalance = mapRawBalanceToOld(newBalance)
    expect(oldBalance).toEqual({
      '0x066b2322a30d7C5838035112F3b816b46D639bBC': {
        AVAX: {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18,
          type: 'NATIVE',
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg',
          balance: '866649536412088689',
          balanceDisplayValue: '0.8666',
          balanceInCurrency: 11.82,
          balanceCurrencyDisplayValue: '11.82',
          priceInCurrency: 13.65,
          coingeckoId: '',
          marketCap: 5857659948,
          vol24: 514889948,
          change24: 7.76611
        },
        '0x596fa47043f99a4e0f122243b841e55375cde0d2': {
          chainId: 43114,
          address: '0x596fA47043f99A4e0F122243B841E55375cdE0d2',
          name: '0x Protocol Token',
          symbol: 'ZRX.e',
          decimals: 18,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/62c62ce8-f4f1-4e7f-89b6-fd68824fb809/a0035c5d69cf961a1c76b6db87ff107d/43114-0x596fA47043f99A4e0F122243B841E55375cdE0d2.png',
          balance: '660552832539',
          balanceDisplayValue: '0.00000066',
          reputation: 'Benign',
          type: 'ERC20'
        },
        '0x625e7708f30ca75bfd92586e17077590c60eb4cd': {
          chainId: 43114,
          address: '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
          name: 'Aave USDC',
          symbol: 'ausdc',
          decimals: 6,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/55E9jxgzCp66uwDcvhpzQX/67e05b40a543df954aa14d803a93ad0c/0x625E7708f30cA75bfd92586e17077590C60eb4cD.png',
          balance: '50812',
          balanceCurrencyDisplayValue: '0.05',
          balanceDisplayValue: '0.0508',
          balanceInCurrency: 0.05,
          priceInCurrency: 0.999855,
          reputation: 'Benign',
          type: 'ERC20'
        },
        '0x6d80113e533a2c0fe82eabd35f1875dcea89ea97': {
          chainId: 43114,
          address: '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97',
          name: 'Aave v3 WAVAX',
          symbol: 'AWAVAX',
          decimals: 18,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/4SpJWLfAzqk4xIeV7PxVxf/dd5509a28e50f0c4346cbf0154779657/0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97.png',
          balance: '100444884190191603',
          balanceCurrencyDisplayValue: '1.36',
          balanceDisplayValue: '0.1004',
          balanceInCurrency: 1.35,
          priceInCurrency: 13.51,
          reputation: 'Benign',
          type: 'ERC20'
        },
        '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': {
          chainId: 43114,
          address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          name: 'USDC',
          symbol: 'USDC',
          decimals: 6,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/e50058c1-2296-4e7e-91ea-83eb03db95ee/9e0705698c0ae8f46a4fe8df96093c44/usdc.png',
          balance: '45339784',
          balanceCurrencyDisplayValue: '45.33',
          balanceDisplayValue: '45.3398',
          balanceInCurrency: 45.33,
          priceInCurrency: 0.999805,
          reputation: 'Benign',
          type: 'ERC20'
        },
        '0xffff003a6bad9b743d658048742935fffe2b6ed7': {
          chainId: 43114,
          address: '0xFFFF003a6BAD9b743d658048742935fFFE2b6ED7',
          name: 'KET',
          symbol: 'KET',
          decimals: 18,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/3DftNW5gEz59nc11jwiFiX/7e86ead1a43ee037a011e0050fa57cbb/v6h9FFO5_400x400.jpg',
          balance: '186491496199324741498',
          balanceCurrencyDisplayValue: '2.33',
          balanceDisplayValue: '186.4915',
          balanceInCurrency: 2.32,
          priceInCurrency: 0.01246792,
          reputation: 'Benign',
          type: 'ERC20'
        }
      }
    })
  })
})
