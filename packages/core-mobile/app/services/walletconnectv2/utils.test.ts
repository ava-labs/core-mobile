import { CoreAccountType } from '@avalabs/types'
import {
  BlockchainNamespace,
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId
} from '@avalabs/core-chains-sdk'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { Account } from 'store/account'
import {
  getAddressWithCaip2ChainId,
  isAddressApprovedInNamespace,
  isChainDeclaredInSession,
  updateAccountListInNamespace
} from './utils'

// Mock data
const mockAccount: Account = {
  name: 'aaaa',
  id: '1',
  index: 0,
  type: CoreAccountType.PRIMARY,
  walletId: 'walletId',
  addressAVM: 'AVMAddress',
  addressPVM: 'PVMAddress',
  addressBTC: 'BTCAddress',
  addressC: 'CAddress',
  addressCoreEth: 'CoreEthAddress',
  addressSVM: 'SVMAddress'
}

describe('getCaip2ChainId', () => {
  it('should add eip155 namespace to a chainId', () => {
    const chainId = 1
    const result = getCaip2ChainId(chainId)
    expect(result).toBe('eip155:1')
  })
})

describe('getAddressWithCaip2ChainId', () => {
  it('should return AVM address for AVAX namespace with X chain ID', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: BlockchainNamespace.AVAX,
      caip2ChainId: AvalancheCaip2ChainId.X
    })
    expect(result).toBe('avax:imji8papUf2EhV3le337w1vgFauqkJg-:AVMAddress')
  })

  it('should return AVM address for AVAX namespace with X testnet chain ID', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: BlockchainNamespace.AVAX,
      caip2ChainId: AvalancheCaip2ChainId.X_TESTNET
    })
    expect(result).toBe('avax:8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl:AVMAddress')
  })

  it('should return PVM address for AVAX namespace with P chain ID', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: BlockchainNamespace.AVAX,
      caip2ChainId: AvalancheCaip2ChainId.P
    })
    expect(result).toBe('avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo:PVMAddress')
  })

  it('should return PVM address for AVAX namespace with P testnet chain ID', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: BlockchainNamespace.AVAX,
      caip2ChainId: AvalancheCaip2ChainId.P_TESTNET
    })
    expect(result).toBe('avax:Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG:PVMAddress')
  })

  it('should return BTC address for BIP122 namespace with mainnet chain ID', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: BlockchainNamespace.BIP122,
      caip2ChainId: BitcoinCaip2ChainId.MAINNET
    })
    expect(result).toBe('bip122:000000000019d6689c085ae165831e93:BTCAddress')
  })

  it('should return BTC address for BIP122 namespace with testnet chain ID', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: BlockchainNamespace.BIP122,
      caip2ChainId: BitcoinCaip2ChainId.TESTNET
    })
    expect(result).toBe('bip122:000000000933ea01ad0ee984209779ba:BTCAddress')
  })

  it('should return C address for EIP155 namespace', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: BlockchainNamespace.EIP155,
      caip2ChainId: 'eip155:1'
    })
    expect(result).toBe('eip155:1:CAddress')
  })

  it('should return undefined for unknown namespace', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: 'UNKNOWN',
      caip2ChainId: 'unknown:1'
    })
    expect(result).toBeUndefined()
  })

  it('should return undefined for AVAX namespace with invalid chain ID', () => {
    const result = getAddressWithCaip2ChainId({
      account: mockAccount,
      blockchainNamespace: BlockchainNamespace.AVAX,
      caip2ChainId: 'invalid:1'
    })
    expect(result).toBeUndefined()
  })

  it('should return undefined for a non-primary Keystone account with no AVM address', () => {
    // Keystone non-primary accounts have empty X/P addresses (CP-14606). The
    // formatter must not emit a malformed "avax:<chain>:" account string with a
    // trailing colon, which would otherwise be advertised to the dApp.
    const result = getAddressWithCaip2ChainId({
      account: { ...mockAccount, index: 1, addressAVM: '', addressPVM: '' },
      blockchainNamespace: BlockchainNamespace.AVAX,
      caip2ChainId: AvalancheCaip2ChainId.X
    })
    expect(result).toBeUndefined()
  })

  it('should return undefined for a non-primary Keystone account with no PVM address', () => {
    const result = getAddressWithCaip2ChainId({
      account: { ...mockAccount, index: 1, addressAVM: '', addressPVM: '' },
      blockchainNamespace: BlockchainNamespace.AVAX,
      caip2ChainId: AvalancheCaip2ChainId.P
    })
    expect(result).toBeUndefined()
  })
})

// Check that the session's approved account set is not widened by a network switch or active-account change 
describe('isAddressApprovedInNamespace', () => {
  const approved = [
    'eip155:1:0x241b0073b66bfc19FCB54308861f604F5Eb8f51b',
    'eip155:43114:0x241b0073b66bfc19FCB54308861f604F5Eb8f51b'
  ]

  it('accepts the same address on a chain the session has not seen yet', () => {
    expect(
      isAddressApprovedInNamespace({
        caip10Account: 'eip155:137:0x241b0073b66bfc19FCB54308861f604F5Eb8f51b',
        accounts: approved
      })
    ).toBe(true)
  })

  it('accepts an EVM address that differs only by checksum casing', () => {
    expect(
      isAddressApprovedInNamespace({
        caip10Account: 'eip155:1:0x241b0073b66bfc19fcb54308861f604f5eb8f51b',
        accounts: approved
      })
    ).toBe(true)
  })

  it('rejects an address the session was never approved for', () => {
    expect(
      isAddressApprovedInNamespace({
        caip10Account: 'eip155:1:0x000000000000000000000000000000000000dEaD',
        accounts: approved
      })
    ).toBe(false)
  })

  it('does not lowercase non-EVM addresses', () => {
    expect(
      isAddressApprovedInNamespace({
        caip10Account: 'solana:mainnet:SoLaNaAddress',
        accounts: ['solana:mainnet:solanaaddress']
      })
    ).toBe(false)
  })

  it('rejects a malformed account string', () => {
    expect(
      isAddressApprovedInNamespace({
        caip10Account: 'eip155:1:',
        accounts: approved
      })
    ).toBe(false)
  })

  it('rejects against an empty approved list', () => {
    expect(
      isAddressApprovedInNamespace({
        caip10Account: 'eip155:1:0x241b0073b66bfc19FCB54308861f604F5Eb8f51b',
        accounts: []
      })
    ).toBe(false)
  })
})

describe('updateAccountListInNamespace', () => {
  it('adds the CAIP-10 entry for an already approved address', () => {
    const accounts = ['eip155:1:0xAbC']

    expect(
      updateAccountListInNamespace({ account: 'eip155:137:0xAbC', accounts })
    ).toBe(true)
    expect(accounts).toEqual(['eip155:1:0xAbC', 'eip155:137:0xAbC'])
  })

  it('is a no-op when the entry is already present', () => {
    const accounts = ['eip155:1:0xAbC']

    expect(
      updateAccountListInNamespace({ account: 'eip155:1:0xAbC', accounts })
    ).toBe(true)
    expect(accounts).toEqual(['eip155:1:0xAbC'])
  })

  it('refuses to add an unapproved account and leaves the list untouched', () => {
    const accounts = ['eip155:1:0xAbC']

    expect(
      updateAccountListInNamespace({
        account: 'eip155:1:0x000000000000000000000000000000000000dEaD',
        accounts
      })
    ).toBe(false)
    expect(accounts).toEqual(['eip155:1:0xAbC'])
  })
})

// Check that the session's declared chain set is not widened by a network switch
describe('isChainDeclaredInSession', () => {
  const session = {
    namespaces: { eip155: { chains: ['eip155:1'] } },
    requiredNamespaces: { eip155: { chains: ['eip155:43114'] } },
    optionalNamespaces: { eip155: { chains: ['eip155:137'] } }
  }

  const check = (caip2ChainId: string): boolean =>
    isChainDeclaredInSession({
      session,
      blockchainNamespace: 'eip155',
      caip2ChainId
    })

  it('accepts a chain already approved on the session', () => {
    expect(check('eip155:1')).toBe(true)
  })

  it('accepts a chain the dApp required but was not approved for', () => {
    expect(check('eip155:43114')).toBe(true)
  })

  it('accepts a chain the dApp listed as optional', () => {
    expect(check('eip155:137')).toBe(true)
  })

  it('rejects a chain nobody ever proposed', () => {
    expect(check('eip155:56')).toBe(false)
  })

  it('rejects a chain from another namespace', () => {
    expect(
      isChainDeclaredInSession({
        session,
        blockchainNamespace: 'solana',
        caip2ChainId: 'eip155:1'
      })
    ).toBe(false)
  })

  it('handles chain-scoped namespace keys that carry no chains array', () => {
    expect(
      isChainDeclaredInSession({
        // CAIP-25 also allows `'eip155:1': {...}` with no `chains`.
        session: { namespaces: { 'eip155:1': {} } },
        blockchainNamespace: 'eip155',
        caip2ChainId: 'eip155:1'
      })
    ).toBe(true)
  })

  it('tolerates a session with no required/optional namespaces', () => {
    expect(
      isChainDeclaredInSession({
        session: { namespaces: { eip155: { chains: ['eip155:1'] } } },
        blockchainNamespace: 'eip155',
        caip2ChainId: 'eip155:999'
      })
    ).toBe(false)
  })
})
