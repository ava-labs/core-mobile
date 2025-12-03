import { CoreAccountType } from '@avalabs/types'
import { mapBalanceResponseToLegacy } from './mapBalanceResponseToLegacy'

const testAccount = {
  name: 'Test Account',
  id: '327ce105-2191-4157-9a9a-a97ce7fae271',
  walletId: '1234567890',
  index: 0,
  type: CoreAccountType.PRIMARY as CoreAccountType.PRIMARY,
  addressC: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
  addressCoreEth: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
  addressBTC: 'bc1qmm9qawklnfau5hhrkt33kqumggxwy7s9raxuxk',
  addressSVM: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW',
  addressAVM: 'X-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf',
  addressPVM: 'P-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf'
}

describe('mapBalanceResponseToLegacy', () => {
  it('should map btc response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'bip122:000000000019d6689c085ae165831e93',
      networkType: 'btc',
      id: 'bc1qmm9qawklnfau5hhrkt33kqumggxwy7s9raxuxk',
      balances: {
        nativeTokenBalance: {
          internalId: 'NATIVE-btc',
          name: 'Bitcoin',
          symbol: 'BTC',
          logoUri:
            'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
          type: 'native',
          decimals: 8,
          balance: '0',
          balanceInCurrency: 0,
          unconfirmedBalance: '0',
          unconfirmedBalanceInCurrency: 0,
          price: 91998,
          priceChange24h: 5355.49,
          priceChangePercentage24h: 6.18116
        },
        totalBalanceInCurrency: 0
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 4503599627370475,
      tokens: [
        {
          name: 'Bitcoin',
          symbol: 'BTC',
          decimals: 8,
          internalId: 'NATIVE-btc',
          logoUri:
            'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
          utxos: [],
          utxosUnconfirmed: [],
          type: 'NATIVE',
          balance: 0n,
          balanceCurrencyDisplayValue: '0.00',
          balanceDisplayValue: '0',
          balanceInCurrency: 0,
          priceInCurrency: 91998,
          change24: 6.18116,
          unconfirmedBalance: 0n,
          unconfirmedBalanceDisplayValue: '0',
          unconfirmedBalanceInCurrency: 0,
          unconfirmedBalanceCurrencyDisplayValue: '0.00',
          localId: 'NATIVE-BTC',
          networkChainId: 4503599627370475,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })

  it('should map evm c-chain response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'eip155:43114',
      networkType: 'evm',
      id: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
      balances: {
        nativeTokenBalance: {
          name: 'Avalanche',
          symbol: 'AVAX',
          type: 'native',
          decimals: 18,
          balance: '866647209533863689',
          internalId: 'NATIVE-avax',
          price: 13.73,
          priceChange24h: 0.903369,
          priceChangePercentage24h: 7.04491,
          balanceInCurrency: 11.79,
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
            price: 0.153014,
            priceChange24h: 0.00634322,
            priceChangePercentage24h: 4.3248,
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
            balance: '50813',
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
            balance: '100445221656736446',
            address: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
            internalId:
              'eip155:43114-0x066b2322a30d7C5838035112F3b816b46D639bBC',
            price: 13.59,
            priceChange24h: 0.04160339,
            priceChangePercentage24h: 0.30704,
            balanceInCurrency: 1.3651155,
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
            price: 0.999949,
            priceChange24h: 0.00007217,
            priceChangePercentage24h: 0.00722,
            balanceInCurrency: 45.33746767122,
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
            price: 0.01258545,
            priceChange24h: 0.00090513,
            priceChangePercentage24h: 7.74918,
            balanceInCurrency: 2.347079448675,
            logoUri:
              'https://images.ctfassets.net/gcj8jwzm6086/3DftNW5gEz59nc11jwiFiX/7e86ead1a43ee037a011e0050fa57cbb/v6h9FFO5_400x400.jpg',
            scanResult: 'Benign'
          }
        ],
        totalBalanceInCurrency: 60.99956975244499
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 43114,
      tokens: [
        {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18,
          type: 'NATIVE',
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg',
          balance: 866647209533863689n,
          balanceDisplayValue: '0.8666',
          balanceInCurrency: 11.89,
          balanceCurrencyDisplayValue: '11.89',
          priceInCurrency: 13.73,
          internalId: 'NATIVE-avax',
          change24: 7.04491,
          localId: 'NATIVE-AVAX',
          networkChainId: 43114,
          isDataAccurate: true
        },
        {
          chainId: 43114,
          address: '0x596fa47043f99a4e0f122243b841e55375cde0d2',
          name: '0x Protocol Token',
          symbol: 'ZRX.e',
          internalId: 'eip155:1-0xe41d2489571d322189246dafa5ebde1f4699f498',
          decimals: 18,
          logoUri:
            'https://coin-images.coingecko.com/coins/images/863/large/0x.png?1696501996',
          balance: 660552832539n,
          balanceInCurrency: 0,
          balanceCurrencyDisplayValue: '0.00',
          balanceDisplayValue: '0.00000066',
          priceInCurrency: 0.153014,
          change24: 4.3248,
          reputation: 'Benign',
          type: 'ERC20',
          localId: '0x596fa47043f99a4e0f122243b841e55375cde0d2',
          networkChainId: 43114,
          isDataAccurate: true
        },
        {
          chainId: 43114,
          address: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
          name: 'Aave USDC',
          symbol: 'ausdc',
          decimals: 6,
          logoUri:
            'https://coin-images.coingecko.com/coins/images/32847/large/usdc_%281%29.png?1699619355',
          change24: 0.00448,
          balance: 50813n,
          balanceInCurrency: 0.05,
          balanceCurrencyDisplayValue: '0.05',
          balanceDisplayValue: '0.0508',
          priceInCurrency: 0.999855,
          reputation: 'Benign',
          type: 'ERC20',
          internalId: 'eip155:1-0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c',
          localId: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
          networkChainId: 43114,
          isDataAccurate: true
        },
        {
          chainId: 43114,
          address: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
          name: 'Aave v3 WAVAX',
          symbol: 'AWAVAX',
          decimals: 18,
          logoUri:
            'https://assets.coingecko.com/coins/images/32915/small/wavax.png?1699824961',
          balance: 100445221656736446n,
          balanceCurrencyDisplayValue: '1.36',
          balanceDisplayValue: '0.1004',
          balanceInCurrency: 1.36,
          priceInCurrency: 13.59,
          change24: 0.30704,
          reputation: 'Benign',
          type: 'ERC20',
          localId: '0x066b2322a30d7c5838035112f3b816b46d639bbc',
          internalId: 'eip155:43114-0x066b2322a30d7C5838035112F3b816b46D639bBC',
          networkChainId: 43114,
          isDataAccurate: true
        },
        {
          chainId: 43114,
          address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
          name: 'USDC',
          symbol: 'USDC',
          decimals: 6,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/28svJFwz3VVA451Hd2S8q2/5051e2f7261b9c14ba75486f679ab90f/usdc.png',
          balance: 45339784n,
          change24: 0.00722,
          balanceInCurrency: 45.33,
          balanceCurrencyDisplayValue: '45.33',
          balanceDisplayValue: '45.3398',
          priceInCurrency: 0.999949,
          reputation: 'Benign',
          type: 'ERC20',
          internalId: 'eip155:1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          localId: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
          networkChainId: 43114,
          isDataAccurate: true
        },
        {
          chainId: 43114,
          address: '0xffff003a6bad9b743d658048742935fffe2b6ed7',
          name: 'KET',
          symbol: 'KET',
          decimals: 18,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/3DftNW5gEz59nc11jwiFiX/7e86ead1a43ee037a011e0050fa57cbb/v6h9FFO5_400x400.jpg',
          balance: 186491496199324741498n,
          balanceCurrencyDisplayValue: '2.34',
          balanceDisplayValue: '186.4915',
          balanceInCurrency: 2.34,
          change24: 7.74918,
          priceInCurrency: 0.01258545,
          internalId: 'eip155:43114-0xffff003a6bad9b743d658048742935fffe2b6ed7',
          reputation: 'Benign',
          type: 'ERC20',
          localId: '0xffff003a6bad9b743d658048742935fffe2b6ed7',
          networkChainId: 43114,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })

  it('should map evm ethereum response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'eip155:1',
      networkType: 'evm',
      id: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
      balances: {
        nativeTokenBalance: {
          name: 'ETH',
          symbol: 'ETH',
          type: 'native',
          decimals: 18,
          balance: '862116340310243',
          price: 3017.71,
          internalId: 'NATIVE-eth',
          priceChange24h: 217.64,
          priceChangePercentage24h: 7.77269,
          balanceInCurrency: 2.5952306,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/65a97cd3-67e3-424a-b278-0744bd6f2dd6/9e925614abed5080ecc2e177e4c35229/43114-0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15.png'
        },
        erc20TokenBalances: [],
        totalBalanceInCurrency: 2.5952306
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 1,
      tokens: [
        {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
          type: 'NATIVE',
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/65a97cd3-67e3-424a-b278-0744bd6f2dd6/9e925614abed5080ecc2e177e4c35229/43114-0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15.png',
          balance: 862116340310243n,
          balanceCurrencyDisplayValue: '2.60',
          balanceDisplayValue: '0.0009',
          balanceInCurrency: 2.6,
          priceInCurrency: 3017.71,
          change24: 7.77269,
          localId: 'NATIVE-ETH',
          internalId: 'NATIVE-eth',
          networkChainId: 1,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })

  it('should map evm optimism response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'eip155:10',
      networkType: 'evm',
      id: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
      balances: {
        nativeTokenBalance: {
          name: 'ETH',
          symbol: 'ETH',
          type: 'native',
          decimals: 18,
          balance: '0',
          price: 3017.71,
          internalId: 'NATIVE-eth',
          priceChange24h: 217.64,
          priceChangePercentage24h: 7.77269,
          balanceInCurrency: 0,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/65a97cd3-67e3-424a-b278-0744bd6f2dd6/9e925614abed5080ecc2e177e4c35229/43114-0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15.png'
        },
        erc20TokenBalances: [],
        totalBalanceInCurrency: 0
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 10,
      tokens: [
        {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
          type: 'NATIVE',
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/65a97cd3-67e3-424a-b278-0744bd6f2dd6/9e925614abed5080ecc2e177e4c35229/43114-0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15.png',
          balance: 0n,
          balanceInCurrency: 0,
          balanceCurrencyDisplayValue: '0.00',
          balanceDisplayValue: '0',
          priceInCurrency: 3017.71,
          change24: 7.77269,
          localId: 'NATIVE-ETH',
          internalId: 'NATIVE-eth',
          networkChainId: 10,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })

  it('should map evm base response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'eip155:8453',
      networkType: 'evm',
      id: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
      balances: {
        nativeTokenBalance: {
          name: 'ETH',
          symbol: 'ETH',
          type: 'native',
          decimals: 18,
          balance: '0',
          price: 3017.71,
          internalId: 'NATIVE-eth',
          priceChange24h: 217.64,
          priceChangePercentage24h: 7.77269,
          balanceInCurrency: 0,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/65a97cd3-67e3-424a-b278-0744bd6f2dd6/9e925614abed5080ecc2e177e4c35229/43114-0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15.png'
        },
        erc20TokenBalances: [],
        totalBalanceInCurrency: 0
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 8453,
      tokens: [
        {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
          type: 'NATIVE',
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/65a97cd3-67e3-424a-b278-0744bd6f2dd6/9e925614abed5080ecc2e177e4c35229/43114-0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15.png',
          balance: 0n,
          balanceInCurrency: 0,
          balanceCurrencyDisplayValue: '0.00',
          balanceDisplayValue: '0',
          priceInCurrency: 3017.71,
          change24: 7.77269,
          localId: 'NATIVE-ETH',
          internalId: 'NATIVE-eth',
          networkChainId: 8453,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })

  it('should map evm arbitrum response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'eip155:42161',
      networkType: 'evm',
      id: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
      balances: {
        nativeTokenBalance: {
          name: 'ETH',
          symbol: 'ETH',
          type: 'native',
          decimals: 18,
          balance: '0',
          price: 3017.71,
          internalId: 'NATIVE-eth',
          priceChange24h: 217.64,
          priceChangePercentage24h: 7.77269,
          balanceInCurrency: 0,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/65a97cd3-67e3-424a-b278-0744bd6f2dd6/9e925614abed5080ecc2e177e4c35229/43114-0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15.png'
        },
        erc20TokenBalances: [],
        totalBalanceInCurrency: 0
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 42161,
      tokens: [
        {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
          type: 'NATIVE',
          internalId: 'NATIVE-eth',
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/65a97cd3-67e3-424a-b278-0744bd6f2dd6/9e925614abed5080ecc2e177e4c35229/43114-0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15.png',
          balance: 0n,
          balanceCurrencyDisplayValue: '0.00',
          balanceDisplayValue: '0',
          balanceInCurrency: 0,
          change24: 7.77269,
          priceInCurrency: 3017.71,
          localId: 'NATIVE-ETH',
          networkChainId: 42161,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })

  it('should map avm response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'avax:imji8papUf2EhV3le337w1vgFauqkJg-',
      networkType: 'avm',
      id: 'default',
      balances: {
        nativeTokenBalance: {
          internalId: 'NATIVE-avax',
          name: 'Avalanche',
          symbol: 'AVAX',
          type: 'native',
          decimals: 9,
          balance: '108000000',
          price: 13.73,
          priceChange24h: 0.903369,
          priceChangePercentage24h: 7.04491,
          balanceInCurrency: 1.48284,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg'
        },
        categories: {
          unlocked: [
            {
              assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
              name: 'Avalanche',
              symbol: 'AVAX',
              type: 'native',
              decimals: 9,
              balance: '108000000'
            }
          ],
          locked: [],
          atomicMemoryUnlocked: {},
          atomicMemoryLocked: {}
        },
        totalBalanceInCurrency: 1.48284
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 4503599627370469,
      tokens: [
        {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 9,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg',
          type: 'NATIVE',
          internalId: 'NATIVE-avax',
          priceInCurrency: 13.73,
          change24: 7.04491,
          balance: 108000000n,
          balanceCurrencyDisplayValue: '1.48',
          balanceDisplayValue: '0.108',
          balanceInCurrency: 1.48,
          available: 108000000n,
          availableInCurrency: 1.48,
          utxos: {
            unlocked: [
              {
                assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
                name: 'Avalanche',
                symbol: 'AVAX',
                denomination: 9,
                amount: '108000000'
              }
            ],
            locked: [],
            atomicMemoryUnlocked: [],
            atomicMemoryLocked: []
          },
          balancePerType: {
            unlocked: 108000000n,
            locked: 0n,
            atomicMemoryUnlocked: 0n,
            atomicMemoryLocked: 0n
          },
          localId: 'AVAX-X',
          networkChainId: 4503599627370469,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })

  it('should map pvm response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo',
      networkType: 'pvm',
      id: 'default',
      balances: {
        nativeTokenBalance: {
          internalId: 'NATIVE-avax',
          name: 'Avalanche',
          symbol: 'AVAX',
          type: 'native',
          decimals: 9,
          balance: '110964791',
          price: 13.73,
          priceChange24h: 0.903369,
          priceChangePercentage24h: 7.04491,
          balanceInCurrency: 1.5234808000000002,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg'
        },
        categories: {
          unlockedStaked: '0',
          unlockedUnstaked: '110964791',
          lockedStaked: '0',
          lockedPlatform: '0',
          lockedStakeable: '0',
          atomicMemoryUnlocked: {},
          atomicMemoryLocked: {}
        },
        totalBalanceInCurrency: 1.5234808000000002
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 4503599627370471,
      tokens: [
        {
          internalId: 'NATIVE-avax',
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 9,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/5VHupNKwnDYJvqMENeV7iJ/3e4b8ff10b69bfa31e70080a4b142cd0/avalanche-avax-logo.svg',
          type: 'NATIVE',
          priceInCurrency: 13.73,
          balance: 110964791n,
          balanceCurrencyDisplayValue: '1.52',
          balanceDisplayValue: '0.111',
          balanceInCurrency: 1.52,
          change24: 7.04491,
          available: 110964791n,
          availableInCurrency: 1.52,
          balancePerType: {
            lockedStaked: 0n,
            lockedStakeable: 0n,
            lockedPlatform: 0n,
            atomicMemoryLocked: 0n,
            atomicMemoryUnlocked: 0n,
            unlockedUnstaked: 110964791n,
            unlockedStaked: 0n
          },
          localId: 'AVAX-P',
          networkChainId: 4503599627370471,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })

  it('should map solana response to legacy', () => {
    const result = mapBalanceResponseToLegacy(testAccount, {
      caip2Id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      networkType: 'svm',
      id: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW',
      balances: {
        nativeTokenBalance: {
          internalId: 'NATIVE-sol',
          name: 'Solana',
          symbol: 'SOL',
          type: 'native',
          decimals: 9,
          balance: '175462704',
          price: 139.88,
          priceChange24h: 12.83,
          priceChangePercentage24h: 10.09823,
          balanceInCurrency: 24.5433448,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/afe3dc3b-beb4-45bd-b949-f3bd9368a9b2/a5dd96847132d1db820f757a90550f50/1-0xD31a59c85aE9D8edEFeC411D448f90841571b89c.png'
        },
        splTokenBalances: [
          {
            type: 'spl',
            name: 'Jupiter',
            symbol: 'JUP',
            decimals: 6,
            address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
            balance: '5062045',
            logoUri:
              'https://images.ctfassets.net/gcj8jwzm6086/4NKff4tEjKZPR1dxpT81CU/ab04e433eac96bc74365b56b667527b1/JUP-logo.png',
            internalId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp-jupyiwryjfskupiha7hker8vutaefosybkedznsdvcn',
            price: 0.248147,
            priceChange24h: 0.01831521,
            priceChangePercentage24h: 7.96896,
            balanceInCurrency: 1.25613252135
          },
          {
            type: 'spl',
            name: 'POPCAT',
            symbol: 'POPCAT',
            decimals: 9,
            address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
            balance: '9490165425',
            logoUri:
              'https://images.ctfassets.net/gcj8jwzm6086/5IKkI9xMhyXU1YU6nr9246/d5cddb8d365f828a976ef752600507b0/POPCAT-logo.png',
            internalId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp-7gcihgdb8fe6knjn2mytkzzcrjqy3t9ghdc8uhymw2hr',
            price: 0.105347,
            priceChange24h: 0.00922028,
            priceChangePercentage24h: 9.59178,
            balanceInCurrency: 0.9997609389900001
          },
          {
            type: 'spl',
            name: 'Orca',
            symbol: 'ORCA',
            decimals: 6,
            address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
            balance: '899178',
            logoUri:
              'https://images.ctfassets.net/gcj8jwzm6086/3xsLR9NZskV01ADXC6ZCWH/0d0d72eed77f2086afa8c8137a0370c4/ORCA-logo.png',
            internalId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp-orcaektdk7lkz57vaayr9qensvepfiu6qemu1kektze',
            price: 1.33,
            priceChange24h: 0.066591,
            priceChangePercentage24h: 5.26146,
            balanceInCurrency: 1.1959094000000001
          }
        ],
        totalBalanceInCurrency: 27.99514766034
      },
      error: null
    })

    expect(result).toStrictEqual({
      accountId: '327ce105-2191-4157-9a9a-a97ce7fae271',
      chainId: 4503599627369476,
      tokens: [
        {
          type: 'NATIVE',
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9,
          balance: 175462704n,
          balanceCurrencyDisplayValue: '24.54',
          balanceDisplayValue: '0.1755',
          balanceInCurrency: 24.54,
          change24: 10.09823,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/afe3dc3b-beb4-45bd-b949-f3bd9368a9b2/a5dd96847132d1db820f757a90550f50/1-0xD31a59c85aE9D8edEFeC411D448f90841571b89c.png',
          internalId: 'NATIVE-sol',
          priceInCurrency: 139.88,
          localId: 'NATIVE-SOL',
          networkChainId: 4503599627369476,
          isDataAccurate: true
        },
        {
          type: 'SPL',
          address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
          name: 'Jupiter',
          symbol: 'JUP',
          decimals: 6,
          balance: 5062045n,
          balanceDisplayValue: '5.062',
          balanceInCurrency: 1.25,
          balanceCurrencyDisplayValue: '1.25',
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/4NKff4tEjKZPR1dxpT81CU/ab04e433eac96bc74365b56b667527b1/JUP-logo.png',
          reputation: undefined,
          priceInCurrency: 0.248147,

          change24: 7.96896,
          internalId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp-jupyiwryjfskupiha7hker8vutaefosybkedznsdvcn',
          localId: 'jupyiwryjfskupiha7hker8vutaefosybkedznsdvcn',
          networkChainId: 4503599627369476,
          isDataAccurate: true
        },
        {
          type: 'SPL',
          address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
          name: 'POPCAT',
          symbol: 'POPCAT',
          decimals: 9,
          balance: 9490165425n,
          balanceCurrencyDisplayValue: '0.99',
          balanceDisplayValue: '9.4902',
          balanceInCurrency: 0.99,
          change24: 9.59178,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/5IKkI9xMhyXU1YU6nr9246/d5cddb8d365f828a976ef752600507b0/POPCAT-logo.png',
          reputation: undefined,
          priceInCurrency: 0.105347,
          internalId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp-7gcihgdb8fe6knjn2mytkzzcrjqy3t9ghdc8uhymw2hr',
          localId: '7gcihgdb8fe6knjn2mytkzzcrjqy3t9ghdc8uhymw2hr',
          networkChainId: 4503599627369476,
          isDataAccurate: true
        },
        {
          type: 'SPL',
          address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
          name: 'Orca',
          symbol: 'ORCA',
          decimals: 6,
          balance: 899178n,
          balanceCurrencyDisplayValue: '1.19',
          balanceDisplayValue: '0.8992',
          balanceInCurrency: 1.19,
          change24: 5.26146,
          logoUri:
            'https://images.ctfassets.net/gcj8jwzm6086/3xsLR9NZskV01ADXC6ZCWH/0d0d72eed77f2086afa8c8137a0370c4/ORCA-logo.png',
          priceInCurrency: 1.33,
          reputation: undefined,
          internalId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp-orcaektdk7lkz57vaayr9qensvepfiu6qemu1kektze',
          localId: 'orcaektdk7lkz57vaayr9qensvepfiu6qemu1kektze',
          networkChainId: 4503599627369476,
          isDataAccurate: true
        }
      ],
      dataAccurate: true,
      error: null
    })
  })
})
