import { KeyboardController } from 'react-native-keyboard-controller'
import { dismissKeyboardOnRemove } from './dismissKeyboardOnRemove'

jest.mock('react-native-keyboard-controller', () => ({
  KeyboardController: { dismiss: jest.fn() }
}))

// The dismiss is deferred one microtask; awaiting a resolved promise flushes it.
const flushMicrotasks = (): Promise<void> => Promise.resolve()

describe('dismissKeyboardOnRemove', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('dismisses the keyboard when removal was not prevented', async () => {
    dismissKeyboardOnRemove({ defaultPrevented: false })

    // Deferred until sibling beforeRemove listeners have run, so nothing yet.
    expect(KeyboardController.dismiss).not.toHaveBeenCalled()

    await flushMicrotasks()

    expect(KeyboardController.dismiss).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss when removal was prevented (e.g. usePreventScreenRemoval)', async () => {
    dismissKeyboardOnRemove({ defaultPrevented: true })
    await flushMicrotasks()

    expect(KeyboardController.dismiss).not.toHaveBeenCalled()
  })

  it('re-reads defaultPrevented at microtask time, not call time', async () => {
    // Guards the direct-root-level-modal case: a beforeRemove listener sharing
    // this navigator's emitter can preventDefault() synchronously AFTER this
    // handler runs but BEFORE the deferred microtask fires. Reading
    // defaultPrevented at call time (instead of at microtask time) would
    // regress that, so this locks in the deferred read.
    const e = { defaultPrevented: false }
    dismissKeyboardOnRemove(e)
    e.defaultPrevented = true

    await flushMicrotasks()

    expect(KeyboardController.dismiss).not.toHaveBeenCalled()
  })
})
