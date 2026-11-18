import { act, renderHook } from '@testing-library/react-hooks'
import { WEAK_PIN_ERROR_MESSAGE } from 'common/utils/weakPin'
import { useCreatePin } from './useCreatePin'

const STRONG_PIN = '193746'

// flush the onError promise chain and the resulting state updates
const flush = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve()
  })
}

const setup = () => {
  const onError = jest.fn(() => Promise.resolve())
  const hook = renderHook(() => useCreatePin({ onError }))
  return { onError, ...hook }
}

describe('useCreatePin', () => {
  it('accepts a strong PIN that is confirmed correctly', async () => {
    const { result, onError } = setup()

    act(() => result.current.onEnterChosenPin(STRONG_PIN))
    expect(result.current.chosenPinEntered).toBe(true)
    expect(result.current.weakPinError).toBeUndefined()

    act(() => result.current.onEnterConfirmedPin(STRONG_PIN))
    expect(result.current.validPin).toBe(STRONG_PIN)
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports an error and resets confirmation when PINs do not match', async () => {
    const { result, onError } = setup()

    act(() => result.current.onEnterChosenPin(STRONG_PIN))
    act(() => result.current.onEnterConfirmedPin('284615'))

    await flush()
    expect(result.current.confirmedPin).toBe('')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(result.current.validPin).toBeUndefined()
  })

  it.each(['000000', '123456', '654321', '121212', '112233'])(
    'rejects weak PIN %s and stays on the new-PIN step',
    async pin => {
      const { result, onError } = setup()

      act(() => result.current.onEnterChosenPin(pin))

      expect(result.current.chosenPinEntered).toBe(false)
      expect(result.current.weakPinError).toBe(WEAK_PIN_ERROR_MESSAGE)
      expect(onError).toHaveBeenCalledTimes(1)
      await flush()
      expect(result.current.chosenPin).toBe('')
      expect(result.current.validPin).toBeUndefined()
    }
  )

  it('clears the weak PIN error once a strong PIN is entered', async () => {
    const { result } = setup()

    act(() => result.current.onEnterChosenPin('111111'))
    await flush()
    expect(result.current.chosenPin).toBe('')
    expect(result.current.weakPinError).toBe(WEAK_PIN_ERROR_MESSAGE)

    act(() => result.current.onEnterChosenPin(STRONG_PIN))
    expect(result.current.weakPinError).toBeUndefined()
    expect(result.current.chosenPinEntered).toBe(true)
  })

  it('does not validate partial PINs', () => {
    const { result, onError } = setup()

    act(() => result.current.onEnterChosenPin('000'))
    expect(result.current.weakPinError).toBeUndefined()
    expect(result.current.chosenPinEntered).toBe(false)
    expect(onError).not.toHaveBeenCalled()
  })

  it('resetPin clears the weak PIN error', async () => {
    const { result } = setup()

    act(() => result.current.onEnterChosenPin('000000'))
    await flush()
    expect(result.current.chosenPin).toBe('')
    act(() => result.current.resetPin())
    expect(result.current.weakPinError).toBeUndefined()
  })
})
