import { hashBlockchainId } from './hashBlockchainId'

describe('hashBlockchainId', () => {
  it('hashes the c-chain mainnet blockchain id', () => {
    const result = hashBlockchainId({
      blockchainId: '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5'
    })
    expect(result).toBe('avax:8aDU0Kqh-5d23op-B-r-4YbQFRbsgF9a')
  })
  it('hashes the c-chain testnet blockchain id', () => {
    const result = hashBlockchainId({
      blockchainId: 'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
      isTestnet: true
    })
    expect(result).toBe('avax:YRLfeDBJpfEqUWe2FYR1OpXsnDDZeKWd')
  })
  it('hashes the p-chain mainnet blockchain id', () => {
    const result = hashBlockchainId({
      blockchainId: '11111111111111111111111111111111LpoYY'
    })
    expect(result).toBe('avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo')
  })
  it('hashes the p-chain testnet blockchain id', () => {
    const result = hashBlockchainId({
      blockchainId: '11111111111111111111111111111111LpoYY',
      isTestnet: true
    })
    expect(result).toBe('avax:Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG')
  })
  it('hashes the x-chain mainnet blockchain id', () => {
    const result = hashBlockchainId({
      blockchainId: '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM'
    })
    expect(result).toBe('avax:imji8papUf2EhV3le337w1vgFauqkJg-')
  })
  it('hashes the x-chain testnet blockchain id', () => {
    const result = hashBlockchainId({
      blockchainId: '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
      isTestnet: true
    })
    expect(result).toBe('avax:8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl')
  })
})
