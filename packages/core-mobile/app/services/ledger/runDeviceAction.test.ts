import { DeviceActionStatus } from '@ledgerhq/device-management-kit'
import { of, Subject, throwError } from 'rxjs'
import { runDeviceAction } from './runDeviceAction'

/**
 * Device actions emit Pending for each step, then exactly one of Completed /
 * Error / Stopped. Awaiting the observable directly resolves with the *first*
 * emission, so the terminal output is never seen — that is what produced
 * "Failed to get master fingerprint" when registering a Bitcoin wallet policy,
 * before the device had done anything.
 */
describe('runDeviceAction', () => {
  const action = <T>(observable: T): { observable: T } => ({ observable })

  it('waits past NotStarted and Pending for the terminal output', async () => {
    const observable = of(
      { status: DeviceActionStatus.NotStarted },
      { status: DeviceActionStatus.Pending, intermediateValue: {} },
      { status: DeviceActionStatus.Pending, intermediateValue: {} },
      { status: DeviceActionStatus.Completed, output: { fingerprint: 'abcd' } }
    )

    await expect(
      runDeviceAction(action(observable) as never, 'getMasterFingerprint')
    ).resolves.toEqual({ fingerprint: 'abcd' })
  })

  it('resolves for an action that completes immediately', async () => {
    const observable = of({
      status: DeviceActionStatus.Completed,
      output: 'done'
    })

    await expect(
      runDeviceAction(action(observable) as never, 'x')
    ).resolves.toBe('done')
  })

  it('throws on Error, naming the action and keeping the cause', async () => {
    const cause = new Error('device said no')
    const observable = of(
      { status: DeviceActionStatus.Pending, intermediateValue: {} },
      { status: DeviceActionStatus.Error, error: cause }
    )

    await expect(
      runDeviceAction(action(observable) as never, 'registerWallet')
    ).rejects.toMatchObject({
      message: 'Ledger registerWallet failed: device said no',
      cause
    })
  })

  // The kit's errors are message-less plain objects; without flattening them
  // the log reads "failed: [object Object]" and the status word is lost.
  it('spells out a kit error object rather than stringifying it', async () => {
    const error = { _tag: 'BtcAppCommandError', errorCode: '6a80' }
    const observable = of(
      { status: DeviceActionStatus.Pending, intermediateValue: {} },
      { status: DeviceActionStatus.Error, error }
    )

    await expect(
      runDeviceAction(action(observable) as never, 'getExtendedPublicKey')
    ).rejects.toThrow(
      'Ledger getExtendedPublicKey failed: BtcAppCommandError: 6a80'
    )
  })

  it('throws on Stopped', async () => {
    const observable = of({ status: DeviceActionStatus.Stopped })

    await expect(
      runDeviceAction(action(observable) as never, 'getExtendedPublicKey')
    ).rejects.toThrow(/did not complete: stopped/)
  })

  it('does not settle while the action is only Pending', async () => {
    const subject = new Subject<unknown>()
    const settled = jest.fn()

    const tick = (): Promise<void> =>
      new Promise(resolve => setImmediate(resolve))

    runDeviceAction(action(subject.asObservable()) as never, 'x')
      .then(settled)
      .catch(settled)
    subject.next({ status: DeviceActionStatus.NotStarted })
    subject.next({ status: DeviceActionStatus.Pending, intermediateValue: {} })
    await tick()

    expect(settled).not.toHaveBeenCalled()

    subject.next({ status: DeviceActionStatus.Completed, output: 'ok' })
    await tick()

    expect(settled).toHaveBeenCalledWith('ok')
  })

  it('propagates an observable that errors outright', async () => {
    await expect(
      runDeviceAction(
        action(throwError(() => new Error('stream blew up'))) as never,
        'x'
      )
    ).rejects.toThrow('stream blew up')
  })
})
