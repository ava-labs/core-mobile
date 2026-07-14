import { Keyboard } from 'react-native'
import { dismissKeyboardOnClose } from './dismissKeyboardOnClose'

describe('dismissKeyboardOnClose', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('dismisses the keyboard when it is visible', () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true)
    const dismiss = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(() => undefined)

    dismissKeyboardOnClose()

    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the keyboard is not visible', () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false)
    const dismiss = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(() => undefined)

    dismissKeyboardOnClose()

    expect(dismiss).not.toHaveBeenCalled()
  })
})
