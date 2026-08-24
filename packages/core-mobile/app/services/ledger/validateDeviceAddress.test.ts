import { utils } from '@avalabs/avalanchejs'
import AppAvalanche from '@avalabs/hw-app-avalanche'
import type Transport from '@ledgerhq/hw-transport'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import { LedgerReturnCode } from './types'
import {
  assertDeviceBech32Address,
  assertDeviceEvmAddress,
  assertDevicePublicKey,
  assertDeviceSolanaAddress
} from './validateDeviceAddress'

const VALID_BODY = utils.formatBech32('avax', new Uint8Array(20).fill(7))
const VALID_EVM = '0x449b3fFFE66378227DbBd05539B6542E5cA75A28'
const VALID_PUBLIC_KEY = Buffer.alloc(33).fill(2)
const VALID_SOLANA_ADDRESS = Buffer.alloc(32).fill(3)

// Shape the Avalanche Ledger app actually returns, captured from a Ledger Flex
// on CP-14964: getAddressAndPubKey replies carry a returnCode and prefix the
// address, getETHAddress replies carry neither.
const okBech32 = {
  address: `P-${VALID_BODY}`,
  returnCode: LedgerReturnCode.SUCCESS,
  errorMessage: 'No errors'
}
const okEvm = { address: VALID_EVM }

describe('assertDeviceBech32Address', () => {
  it('returns the prefix-stripped body on a healthy reply', () => {
    expect(assertDeviceBech32Address('XP', okBech32)).toBe(VALID_BODY)
  })

  it('accepts an unprefixed body', () => {
    expect(
      assertDeviceBech32Address('XP', { ...okBech32, address: VALID_BODY })
    ).toBe(VALID_BODY)
  })

  // The bug: an empty body yielded `P-${''}` === 'P-', a truthy string that
  // passed every downstream emptiness guard.
  it('throws on an empty address rather than yielding a bare prefix', () => {
    expect(() =>
      assertDeviceBech32Address('XP', { ...okBech32, address: '' })
    ).toThrow(/XP/)
  })

  it('throws when the address is only a chain-alias prefix', () => {
    expect(() =>
      assertDeviceBech32Address('XP', { ...okBech32, address: 'P-' })
    ).toThrow(/XP/)
  })

  it('throws on an absent address', () => {
    expect(() =>
      assertDeviceBech32Address('XP', {
        returnCode: LedgerReturnCode.SUCCESS
      })
    ).toThrow(/XP/)
  })

  it('throws on a non-bech32 address body', () => {
    expect(() =>
      assertDeviceBech32Address('XP', { ...okBech32, address: 'P-not-bech32' })
    ).toThrow(/XP/)
  })

  // getAllAddresses previously performed no returnCode check at all, unlike its
  // sibling getExtendedPubKey.
  it.each([
    ['APP_NOT_OPEN', LedgerReturnCode.APP_NOT_OPEN],
    ['DEVICE_LOCKED', LedgerReturnCode.DEVICE_LOCKED],
    ['USER_REJECTED', LedgerReturnCode.USER_REJECTED]
  ])('throws on a non-success return code (%s)', (_name, code) => {
    expect(() =>
      assertDeviceBech32Address('XP', { ...okBech32, returnCode: code })
    ).toThrow(new RegExp(code.toString(16)))
  })

  it('throws on a non-success return code even when the address looks valid', () => {
    expect(() =>
      assertDeviceBech32Address('XP', {
        address: `P-${VALID_BODY}`,
        returnCode: LedgerReturnCode.APP_NOT_OPEN,
        errorMessage: 'Instruction not supported'
      })
    ).toThrow(/6a80/)
  })

  // Real mainnet/fuji-bodied addresses (CP-14964): a Ledger session on the
  // wrong network hrp still passes the bech32/prefix checks above, so only an
  // explicit expectedHrp comparison catches the mismatch.
  describe('expectedHrp', () => {
    const AVAX_BODY = 'avax16n9mgjanxmst06eh7hk7tg747qamqqjwm5s2vk'
    const FUJI_BODY = 'fuji16n9mgjanxmst06eh7hk7tg747qamqqjwhx54qf'

    it('throws when expecting avax but the device replied with a fuji body', () => {
      expect(() =>
        assertDeviceBech32Address(
          'XP',
          { ...okBech32, address: `P-${FUJI_BODY}` },
          'avax'
        )
      ).toThrow(/XP/)
    })

    it('throws when expecting fuji but the device replied with an avax body', () => {
      expect(() =>
        assertDeviceBech32Address(
          'XP',
          { ...okBech32, address: `P-${AVAX_BODY}` },
          'fuji'
        )
      ).toThrow(/XP/)
    })

    it('passes when the decoded hrp matches expectedHrp', () => {
      expect(
        assertDeviceBech32Address(
          'XP',
          { ...okBech32, address: `P-${AVAX_BODY}` },
          'avax'
        )
      ).toBe(AVAX_BODY)
    })

    it('skips the hrp check when expectedHrp is omitted', () => {
      expect(
        assertDeviceBech32Address('XP', {
          ...okBech32,
          address: `P-${FUJI_BODY}`
        })
      ).toBe(FUJI_BODY)
    })
  })
})

describe('assertDeviceEvmAddress', () => {
  it('returns the address on a healthy reply', () => {
    expect(assertDeviceEvmAddress('getETHAddress', okEvm)).toBe(VALID_EVM)
  })

  // getETHAddress replies have no returnCode field, so the check must not
  // reject them for its absence.
  it('does not require a returnCode', () => {
    expect(() => assertDeviceEvmAddress('getETHAddress', okEvm)).not.toThrow()
  })

  it('throws on an empty address', () => {
    expect(() =>
      assertDeviceEvmAddress('getETHAddress', { address: '' })
    ).toThrow(/getETHAddress/)
  })

  it('throws on an absent address', () => {
    expect(() => assertDeviceEvmAddress('getETHAddress', {})).toThrow(
      /getETHAddress/
    )
  })

  it('throws on a malformed hex address', () => {
    expect(() =>
      assertDeviceEvmAddress('getETHAddress', { address: '0xdeadbeef' })
    ).toThrow(/getETHAddress/)
  })

  it('throws on a bech32 address delivered to the EVM call', () => {
    expect(() =>
      assertDeviceEvmAddress('getETHAddress', { address: `P-${VALID_BODY}` })
    ).toThrow(/getETHAddress/)
  })
})

describe('assertDevicePublicKey', () => {
  it('returns the public key on a healthy 33-byte reply', () => {
    expect(
      assertDevicePublicKey('getAddressAndPubKey(evm)', {
        publicKey: VALID_PUBLIC_KEY,
        returnCode: LedgerReturnCode.SUCCESS
      })
    ).toBe(VALID_PUBLIC_KEY)
  })

  it('throws on an empty public key', () => {
    expect(() =>
      assertDevicePublicKey('getAddressAndPubKey(evm)', {
        publicKey: Buffer.alloc(0),
        returnCode: LedgerReturnCode.SUCCESS
      })
    ).toThrow(/getAddressAndPubKey\(evm\)/)
  })

  it('throws on a truncated (16-byte) public key', () => {
    expect(() =>
      assertDevicePublicKey('getAddressAndPubKey(evm)', {
        publicKey: Buffer.alloc(16).fill(2),
        returnCode: LedgerReturnCode.SUCCESS
      })
    ).toThrow(/16 bytes/)
  })

  it('throws on an uncompressed (65-byte) public key', () => {
    expect(() =>
      assertDevicePublicKey('getAddressAndPubKey(evm)', {
        publicKey: Buffer.alloc(65).fill(4),
        returnCode: LedgerReturnCode.SUCCESS
      })
    ).toThrow(/65 bytes/)
  })

  it('throws on an absent public key', () => {
    expect(() =>
      assertDevicePublicKey('getAddressAndPubKey(evm)', {
        returnCode: LedgerReturnCode.SUCCESS
      })
    ).toThrow(/getAddressAndPubKey\(evm\)/)
  })

  it('throws on a non-success return code before checking the key', () => {
    expect(() =>
      assertDevicePublicKey('getAddressAndPubKey(evm)', {
        publicKey: Buffer.alloc(0),
        returnCode: LedgerReturnCode.APP_NOT_OPEN,
        errorMessage: 'Instruction not supported'
      })
    ).toThrow(/6a80/)
  })
})

describe('assertDeviceSolanaAddress', () => {
  it('returns the address on a healthy 32-byte reply', () => {
    expect(
      assertDeviceSolanaAddress('getAddress(solana)', {
        address: VALID_SOLANA_ADDRESS
      })
    ).toBe(VALID_SOLANA_ADDRESS)
  })

  it('throws on an empty address', () => {
    expect(() =>
      assertDeviceSolanaAddress('getAddress(solana)', {
        address: Buffer.alloc(0)
      })
    ).toThrow(/getAddress\(solana\)/)
  })

  it('throws on a 31-byte address', () => {
    expect(() =>
      assertDeviceSolanaAddress('getAddress(solana)', {
        address: Buffer.alloc(31).fill(3)
      })
    ).toThrow(/31 bytes/)
  })

  it('throws on an absent address', () => {
    expect(() => assertDeviceSolanaAddress('getAddress(solana)', {})).toThrow(
      /getAddress\(solana\)/
    )
  })
})

describe('truncated BLE frame', () => {
  const PUBLIC_KEY_LENGTH = 33
  const HASH_LENGTH = 20

  /**
   * A frame that lost its address bytes in transit but kept its trailing status
   * word. Both affected users onboarded during a BLE failure storm that
   * included `TransportError: Invalid tag 8` and a failed subscription to the
   * Ledger notify characteristic — i.e. frame-level corruption of the channel
   * the device replies on.
   */
  const truncatedFrame = Buffer.concat([
    new Uint8Array([PUBLIC_KEY_LENGTH]),
    new Uint8Array(PUBLIC_KEY_LENGTH).fill(0xab),
    new Uint8Array(HASH_LENGTH).fill(0xcd),
    new Uint8Array([0x90, 0x00])
  ])

  const appFor = (frame: Buffer): AppAvalanche =>
    new AppAvalanche({
      send: jest.fn().mockResolvedValue(frame),
      decorateAppAPIMethods: jest.fn()
    } as unknown as Transport)

  /**
   * The status word survives at the tail, so the reply parses as SUCCESS while
   * the address comes back empty. A returnCode check alone therefore cannot
   * catch this — validating the address body is what closes it.
   */
  it('parses as SUCCESS with an empty address', async () => {
    const reply = await appFor(truncatedFrame).getAddressAndPubKey(
      "m/44'/9000'/0'/0/0",
      false,
      'avax'
    )

    expect(reply.returnCode).toBe(LedgerReturnCode.SUCCESS)
    expect(reply.address).toBe('')
  })

  it('produced the bare "P-" that reached production', async () => {
    const reply = await appFor(truncatedFrame).getAddressAndPubKey(
      "m/44'/9000'/0'/0/0",
      false,
      'avax'
    )

    expect(`P-${stripAddressPrefix(reply.address)}`).toBe('P-')
  })

  it('is rejected by the validator', async () => {
    const reply = await appFor(truncatedFrame).getAddressAndPubKey(
      "m/44'/9000'/0'/0/0",
      false,
      'avax'
    )

    expect(() =>
      assertDeviceBech32Address('getAddressAndPubKey(XP)', reply)
    ).toThrow(/empty address body/)
  })
})
