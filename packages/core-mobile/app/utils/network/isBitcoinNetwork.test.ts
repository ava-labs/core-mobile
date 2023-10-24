import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import { isBitcoinChainId } from './isBitcoinNetwork'

it('should return true for Bitcoin main network', () => {
  const chainId = BITCOIN_NETWORK.chainId
  const result = isBitcoinChainId(chainId)
  expect(result).toBe(true)
})

it('should return true for Bitcoin test network', () => {
  const chainId = BITCOIN_TEST_NETWORK.chainId
  const result = isBitcoinChainId(chainId)
  expect(result).toBe(true)
})

it('should return false for Ethereum main network', () => {
  const chainId = 1
  const result = isBitcoinChainId(chainId)
  expect(result).toBe(false)
})

it('should return false for Ethereum test network', () => {
  const chainId = 5
  const result = isBitcoinChainId(chainId)
  expect(result).toBe(false)
})

it('should return false for an arbitrary chainId', () => {
  const chainId = 123
  const result = isBitcoinChainId(chainId)
  expect(result).toBe(false)
})
