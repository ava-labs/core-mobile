import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import { getAvalancheChainAliasCaip2 } from './caip2ChainIds'

describe('getAvalancheChainAliasCaip2', () => {
  describe('mainnet', () => {
    it('maps C → AvalancheCaip2ChainId.C', () => {
      expect(getAvalancheChainAliasCaip2('C', false)).toBe(
        AvalancheCaip2ChainId.C
      )
    })

    it('maps P → AvalancheCaip2ChainId.P', () => {
      expect(getAvalancheChainAliasCaip2('P', false)).toBe(
        AvalancheCaip2ChainId.P
      )
    })

    it('maps X → AvalancheCaip2ChainId.X', () => {
      expect(getAvalancheChainAliasCaip2('X', false)).toBe(
        AvalancheCaip2ChainId.X
      )
    })
  })

  describe('testnet (Fuji)', () => {
    it('maps C → AvalancheCaip2ChainId.C_TESTNET', () => {
      expect(getAvalancheChainAliasCaip2('C', true)).toBe(
        AvalancheCaip2ChainId.C_TESTNET
      )
    })

    it('maps P → AvalancheCaip2ChainId.P_TESTNET', () => {
      expect(getAvalancheChainAliasCaip2('P', true)).toBe(
        AvalancheCaip2ChainId.P_TESTNET
      )
    })

    it('maps X → AvalancheCaip2ChainId.X_TESTNET', () => {
      expect(getAvalancheChainAliasCaip2('X', true)).toBe(
        AvalancheCaip2ChainId.X_TESTNET
      )
    })
  })
})
