import { TextInput } from 'react-native'
import { KeyboardController } from 'react-native-keyboard-controller'
import { dismissKeyboardIfOrphaned } from './dismissKeyboardIfOrphaned'

jest.mock('react-native-keyboard-controller', () => ({
  KeyboardController: {
    isVisible: jest.fn(),
    dismiss: jest.fn()
  }
}))

describe('dismissKeyboardIfOrphaned', () => {
  beforeEach(() => {
    // Run the deferred check synchronously so assertions are simple.
    jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('dismisses when the keyboard is visible and no input is focused (orphaned)', () => {
    ;(KeyboardController.isVisible as jest.Mock).mockReturnValue(true)
    jest
      .spyOn(TextInput.State, 'currentlyFocusedInput')
      .mockReturnValue(null as never)

    dismissKeyboardIfOrphaned()

    expect(KeyboardController.dismiss).toHaveBeenCalledTimes(1)
  })

  it('does nothing when an input is still focused (keyboard is owned)', () => {
    ;(KeyboardController.isVisible as jest.Mock).mockReturnValue(true)
    jest
      .spyOn(TextInput.State, 'currentlyFocusedInput')
      .mockReturnValue({} as never)

    dismissKeyboardIfOrphaned()

    expect(KeyboardController.dismiss).not.toHaveBeenCalled()
  })

  it('does nothing when the keyboard is not visible', () => {
    ;(KeyboardController.isVisible as jest.Mock).mockReturnValue(false)
    jest
      .spyOn(TextInput.State, 'currentlyFocusedInput')
      .mockReturnValue(null as never)

    dismissKeyboardIfOrphaned()

    expect(KeyboardController.dismiss).not.toHaveBeenCalled()
  })
})
