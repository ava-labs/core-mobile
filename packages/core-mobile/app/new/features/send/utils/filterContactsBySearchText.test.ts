import { Contact } from 'store/addressBook'
import { filterContactsBySearchText } from './filterContactsBySearchText'

const makeContact = (
  overrides: Partial<Contact> & { id: string; name: string }
): Contact =>
  ({
    type: 'contact',
    ...overrides
  } as Contact)

describe('filterContactsBySearchText', () => {
  const solanaAddress = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'
  const evmAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const xpAddress = 'avax1k6rjd2j3m0jatw7ef9f3rrf754eq6mgqxuep3p'
  const btcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

  const contacts: Contact[] = [
    makeContact({
      id: '1',
      name: 'Alice',
      address: evmAddress,
      addressSVM: solanaAddress
    }),
    makeContact({
      id: '2',
      name: 'Bob',
      address: evmAddress
    }),
    makeContact({
      id: '3',
      name: 'Charlie',
      addressXP: xpAddress,
      addressBTC: btcAddress
    }),
    makeContact({
      id: '4',
      name: 'Dave',
      addressSVM: solanaAddress
    })
  ]

  it('should return all contacts when searching by name', () => {
    const result = filterContactsBySearchText(contacts, 'alice')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })

  it('should match contacts by EVM address', () => {
    const result = filterContactsBySearchText(contacts, evmAddress)
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['1', '2'])
  })

  it('should match contacts by Solana address', () => {
    const result = filterContactsBySearchText(contacts, solanaAddress)
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['1', '4'])
  })

  it('should match contacts by XP address', () => {
    const result = filterContactsBySearchText(contacts, xpAddress)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('3')
  })

  it('should match contacts by BTC address', () => {
    const result = filterContactsBySearchText(contacts, btcAddress)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('3')
  })

  it('should match by partial address (case-insensitive)', () => {
    const result = filterContactsBySearchText(contacts, '7ECDH')
    expect(result).toHaveLength(2)
    expect(result.map(c => c.id)).toEqual(['1', '4'])
  })

  it('should return empty array when nothing matches', () => {
    const result = filterContactsBySearchText(contacts, 'nonexistent')
    expect(result).toHaveLength(0)
  })

  it('should return empty array for empty contacts list', () => {
    const result = filterContactsBySearchText([], solanaAddress)
    expect(result).toHaveLength(0)
  })
})
