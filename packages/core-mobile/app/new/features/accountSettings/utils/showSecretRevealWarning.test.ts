import {
  getSecretRevealWarningCopy,
  showSecretRevealWarning
} from './showSecretRevealWarning'

const mockShowAlert = jest.fn()
jest.mock('@avalabs/k2-alpine', () => ({
  showAlert: (...args: unknown[]) => mockShowAlert(...args)
}))

type AlertButton = { text: string; onPress?: () => void }
type AlertConfig = {
  title: string
  description: string
  buttons: AlertButton[]
}
const lastAlert = (): AlertConfig =>
  mockShowAlert.mock.calls[mockShowAlert.mock.calls.length - 1][0]

describe('getSecretRevealWarningCopy', () => {
  it.each([
    ['recoveryPhrase', 'recovery phrase'],
    ['privateKey', 'private key']
  ] as const)('covers every required risk for %s', (secretType, label) => {
    const { title, description } = getSecretRevealWarningCopy(secretType)
    expect(title).toContain(label)
    expect(description).toContain(`Anyone with your ${label}`)
    expect(description).toContain('steal your funds')
    expect(description).toContain('Never share it')
    expect(description).toContain(`Core will never ask for your ${label}`)
  })
})

describe('showSecretRevealWarning', () => {
  it('shows a Cancel / Continue alert without calling onContinue', () => {
    const onContinue = jest.fn()
    showSecretRevealWarning({ secretType: 'recoveryPhrase', onContinue })

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    const alert = lastAlert()
    expect(alert).toMatchObject(getSecretRevealWarningCopy('recoveryPhrase'))
    expect(alert.buttons.map(b => b.text)).toEqual(['Cancel', 'Continue'])
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('calls onContinue only when Continue is pressed', () => {
    const onContinue = jest.fn()
    showSecretRevealWarning({ secretType: 'privateKey', onContinue })
    const [cancel, cont] = lastAlert().buttons

    cancel?.onPress?.()
    expect(onContinue).not.toHaveBeenCalled()

    cont?.onPress?.()
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
