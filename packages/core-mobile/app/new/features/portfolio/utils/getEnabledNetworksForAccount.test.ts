import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { CoreAccountType } from '@avalabs/types'
import { Account } from 'store/account/types'
import { getEnabledNetworksForAccount } from './getEnabledNetworksForAccount'

const makeNetwork = (
  vmName: NetworkVMType,
  chainId: number,
  overrides: Partial<Network> = {}
): Network =>
  ({
    chainId,
    vmName,
    isTestnet: false,
    ...overrides
  } as Network)

const makeAccount = (overrides: Partial<Account> = {}): Account =>
  ({
    id: 'account-1',
    name: 'Account 1',
    type: CoreAccountType.PRIMARY,
    walletId: 'wallet-1',
    index: 0,
    addressC: '0xC',
    addressBTC: 'btc1',
    addressAVM: 'X-avm1',
    addressPVM: 'P-pvm1',
    addressCoreEth: '0xCoreEth',
    addressSVM: 'svm1',
    ...overrides
  } as Account)

const EVM = makeNetwork(NetworkVMType.EVM, 43114)
const BTC = makeNetwork(NetworkVMType.BITCOIN, 1)
const AVM = makeNetwork(NetworkVMType.AVM, 9000)
const PVM = makeNetwork(NetworkVMType.PVM, 9001)
const SVM = makeNetwork(NetworkVMType.SVM, 9002)

describe('getEnabledNetworksForAccount', () => {
  it('returns every enabled network when the account has all addresses', () => {
    const account = makeAccount()
    const enabled = [EVM, BTC, AVM, PVM, SVM]
    expect(getEnabledNetworksForAccount(account, enabled)).toEqual(enabled)
  })

  it('excludes Solana for a Keystone-style account with no SVM address', () => {
    // Keystone wallets cannot derive a Solana address — this is the
    // CP-14303 scenario that previously caused the infinite spinner.
    const keystoneAccount = makeAccount({ addressSVM: '' })
    const enabled = [EVM, BTC, AVM, PVM, SVM]
    expect(getEnabledNetworksForAccount(keystoneAccount, enabled)).toEqual([
      EVM,
      BTC,
      AVM,
      PVM
    ])
  })

  it('excludes XP networks for a non-primary Keystone account', () => {
    // The Keystone SDK only exposes the XP xpub for account index 0, so
    // non-primary accounts have no AVM/PVM addresses.
    const keystoneNonPrimary = makeAccount({
      index: 1,
      addressAVM: '',
      addressPVM: '',
      addressSVM: ''
    })
    const enabled = [EVM, BTC, AVM, PVM, SVM]
    expect(getEnabledNetworksForAccount(keystoneNonPrimary, enabled)).toEqual([
      EVM,
      BTC
    ])
  })

  it('treats whitespace-only addresses as missing', () => {
    // Mirrors the trim-based check used in BalanceService /
    // buildRequestItemsForAccounts so we don't count a network as enabled
    // for the account when the request pipeline would skip it.
    const account = makeAccount({ addressSVM: '   ' })
    expect(getEnabledNetworksForAccount(account, [EVM, SVM])).toEqual([EVM])
  })

  it('returns an empty array when no enabled networks are supported', () => {
    const account = makeAccount({
      addressC: '',
      addressBTC: '',
      addressAVM: '',
      addressPVM: '',
      addressSVM: '',
      addressCoreEth: ''
    })
    expect(getEnabledNetworksForAccount(account, [EVM, BTC, SVM])).toEqual([])
  })

  it('returns an empty array when no networks are enabled', () => {
    expect(getEnabledNetworksForAccount(makeAccount(), [])).toEqual([])
  })
})
