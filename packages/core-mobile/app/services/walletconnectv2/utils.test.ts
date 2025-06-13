import { CorePrimaryAccount, CoreAccountType, WalletType } from '@avalabs/types'
import {
  BlockchainNamespace,
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId
} from '@avalabs/core-chains-sdk'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { getAddressWithCaip2ChainId } from './utils'

// Mock data
const mockAccount: CorePrimaryAccount = {
  active: true,
  name: 'aaaa',
  id: '1',
  index: 0,
  type: CoreAccountType.PRIMARY,
  walletType: WalletType.Mnemonic,
  walletId: 'walletId',
  walletName: 'walletName',
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
})
