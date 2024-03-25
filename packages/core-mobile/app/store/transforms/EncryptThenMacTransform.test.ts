import {
  EncryptThenMacTransform,
  VersionedStore
} from 'store/transforms/EncryptThenMacTransform'
import { AppState } from 'store/app'
import { BridgeState } from 'store/bridge'
import { initialState as advancedState } from 'store/settings/advanced/types'
import { initialState as securityState } from 'store/settings/securityPrivacy/types'
import { initialState as currencyState } from 'store/settings/currency/types'
import { Networks, NetworkState } from 'store/network'
import { AccountsState } from 'store/account'
import { NotificationsState } from 'store/notifications'
import { PosthogState } from 'store/posthog'
import { NFTItemData, NftState } from 'store/nft'
import { PortfolioState } from 'store/portfolio'
import { RawRootState, RootState } from 'store/index'
import { encryptTransform } from 'redux-persist-transform-encrypt'
import { Network } from '@avalabs/chains-sdk'

const secretKey =
  '037f948ec4fc19c751a8508744626399768efc81d07e2b9dd5ad298196328efa'
const secretMacKey =
  '037f948ec4fc19c751a8508744626399768efc81d07e2b9dd5ad298196328123'

describe('EncryptThenMacTransform functions', () => {
  it('should decode to same encoded object', () => {
    const transform = EncryptThenMacTransform(secretKey, secretMacKey)
    const encoded = transform.in(initialState, 'app', initialState)
    expect(encoded).not.toEqual(initialState)

    const decoded = transform.out(encoded, 'app', initialState)
    expect(decoded).toEqual(initialState)
  })

  it('should successfully decrypt state encrypted using redux-persist-transform-encrypt library', () => {
    const state = { test: 'test' }
    const reduxPersistTransformEncrypt = encryptTransform<
      typeof state,
      typeof state,
      typeof state
    >({
      secretKey
    })
    const stateEncrypted = reduxPersistTransformEncrypt.in(state, 'test', state)

    const transform = EncryptThenMacTransform(secretKey, secretMacKey)
    const decrypted = transform.out(
      stateEncrypted as unknown as VersionedStore,
      'app',
      {} as unknown as RawRootState
    )
    expect(decrypted).toEqual(state)
  })

  it('should return undefined on decrypting if state is object but not AesGcmStoreType', async () => {
    const state = { test: 'test' }
    const transform = EncryptThenMacTransform(secretKey, secretMacKey)
    const result = transform.out(
      state as unknown as VersionedStore,
      'app',
      {} as unknown as RawRootState
    )
    expect(result).toBeUndefined()
  })

  it('should return undefined on decrypting if state is undefined', async () => {
    const transform = EncryptThenMacTransform(secretKey, secretMacKey)
    const result = transform.out(
      undefined,
      'app',
      {} as unknown as RawRootState
    )
    expect(result).toBeUndefined()
  })

  it('should return undefined on encrypting if state is undefined', async () => {
    const transform = EncryptThenMacTransform(secretKey, secretMacKey)
    const result = transform.in(undefined, 'app', {} as unknown as RawRootState)
    expect(result).toBeUndefined()
  })
})

const initialState = {
  app: {
    appState: 'active',
    isLocked: true,
    isReady: false,
    walletState: 2
  } as AppState,
  network: {
    active: 43114,
    customNetworks: {},
    favorites: [43114, 43113, 4503599627370475, 4503599627370474, 1],
    networks: {
      '1': {
        chainId: 1,
        chainName: 'Ethereum',
        description: 'The primary public Ethereum blockchain network.',
        explorerUrl: 'https://etherscan.io',
        isTestnet: false,
        logoUri:
          'https://images.ctfassets.net/gcj8jwzm6086/6l56QLVZmvacuBfjHBTThP/791d743dd2c526692562780c2325fedf/eth-circle__1_.svg',
        primaryColor: '#818384',
        rpcUrl: 'https://proxy-api.avax.network/proxy/infura/mainnet',
        subnetExplorerUriId: 'ethereum',
        vmName: 'EVM'
      } as Network
    } as Networks
  } as NetworkState,
  account: {
    accounts: {
      '0': {
        address: '0x341b0073b66bfc19FCB54308861f604F5Eb8f51b',
        addressAVM: 'X-avax17y8xf7ddfjwv0qg4zvuew0kucmylr749n83n0h',
        addressBtc: 'bc1qctnzrtj8k6f362x34t3n09tk0er0eu4c2e56aq',
        addressCoreEth: 'C-avax1ctnzrtj8k6f362x34t3n09tk0er0eu4cfp8cqs',
        addressPVM: 'P-avax17y8xf7ddfjwv0qg4zvuew0kucmylr749n83n0h',
        index: 0,
        title: 'Account 1'
      }
    },
    activeAccountIndex: 0
  } as AccountsState,
  notifications: {
    hasPromptedAfterFirstDelegation: false,
    notificationSubscriptions: {}
  } as NotificationsState,
  bridge: {} as BridgeState,
  posthog: {
    distinctID: 'f624f1a0-deda-44e4-b054-0017aeea9d67',
    featureFlags: {
      'bridge-feature': true,
      'bridge-feature-btc': true,
      'bridge-feature-eth': true,
      'buy-feature-coinbase': true,
      'defi-feature': true,
      'earn-feature': true,
      events: true,
      everything: true,
      'send-feature': true,
      'send-nft-android-feature': true,
      'send-nft-ios-feature': true,
      'sentry-sample-rate': '90',
      'swap-feature': true
    },
    isAnalyticsEnabled: true,
    userID: '845c3f7f-d81f-4501-9143-7ef9f689cbf6'
  } as PosthogState,
  nft: {
    hiddenNfts: {},
    nfts: {
      '0x48bcac480f22A2Dfe42026DdE212585e917b7142195': {
        address: '0x48bcac480f22A2Dfe42026DdE212585e917b7142',
        chainId: '43114',
        ercType: 'ERC-721',
        name: 'Aggregate Humanity',
        owner: '0x341b0073b66bfc19FCB54308861f604F5Eb8f51b',
        symbol: 'Ah',
        tokenId: '195',
        tokenUri:
          'https://firebasestorage.googleapis.com/v0/b/wilson-mango.appspot.com/o/generated_195.json?alt=media',
        uid: '0x48bcac480f22A2Dfe42026DdE212585e917b7142195'
      } as NFTItemData
    }
  } as NftState,
  settings: {
    currency: currencyState,
    securityPrivacy: securityState,
    advanced: advancedState
  },
  portfolio: {
    tokenBlacklist: []
  } as PortfolioState
} as RootState
