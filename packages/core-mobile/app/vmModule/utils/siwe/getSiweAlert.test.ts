import { AlertType, RpcMethod } from '@avalabs/vm-module-types'
import type {
  DisplayData,
  RpcRequest,
  SigningData
} from '@avalabs/vm-module-types'
import { maybeInjectSiweAlert } from './getSiweAlert'

const toHex = (s: string): string =>
  '0x' + Buffer.from(s, 'utf8').toString('hex')

const TAIL =
  'Version: 1\nChain ID: 1\nNonce: abc\nIssued At: 2026-10-06T00:00:00Z'
const HEADER =
  'victim.com wants you to sign in with your Ethereum account:\n' +
  '0x0000000000000000000000000000000000000001\n'

const run = (
  message: string,
  dappUrl: string,
  asPlainText = false
): DisplayData =>
  maybeInjectSiweAlert({
    request: { dappInfo: { url: dappUrl } } as unknown as RpcRequest,
    signingData: {
      type: RpcMethod.PERSONAL_SIGN,
      data: asPlainText ? message : toHex(message)
    } as unknown as SigningData,
    displayData: {} as DisplayData
  })

describe('maybeInjectSiweAlert', () => {
  it('raises a DANGER alert for a smuggled-URI message from another origin', () => {
    const msg =
      HEADER +
      '\nLegit statement\n\nURI: https://evil.com\n\nURI: https://victim.com\n' +
      TAIL
    const result = run(msg, 'https://evil.com')
    expect(result.alert?.type).toBe(AlertType.DANGER)
    expect(result.alert?.details.title).toBe('Malformed sign-in request')
  })

  it('raises no alert for a well-formed message from the matching domain', () => {
    const msg = HEADER + '\nURI: https://victim.com\n' + TAIL
    expect(run(msg, 'https://victim.com').alert).toBeUndefined()
  })

  it('still raises the mismatch alert for a well-formed message from another origin', () => {
    const msg = HEADER + '\nURI: https://victim.com\n' + TAIL
    expect(run(msg, 'https://evil.com').alert?.type).toBe(AlertType.DANGER)
  })

  it('ignores non-SIWE personal_sign messages', () => {
    expect(run('hello', 'https://evil.com').alert).toBeUndefined()
  })

  it('raises a DANGER alert for a smuggled-URI message passed as plain text (not hex)', () => {
    const msg =
      HEADER +
      '\nLegit statement\n\nURI: https://evil.com\n\nURI: https://victim.com\n' +
      TAIL
    const result = run(msg, 'https://evil.com', true)
    expect(result.alert?.type).toBe(AlertType.DANGER)
    expect(result.alert?.details.title).toBe('Malformed sign-in request')
  })

  it('raises no alert for a plain-text well-formed message from the matching domain', () => {
    const msg = HEADER + '\nURI: https://victim.com\n' + TAIL
    expect(run(msg, 'https://victim.com', true).alert).toBeUndefined()
  })
})
