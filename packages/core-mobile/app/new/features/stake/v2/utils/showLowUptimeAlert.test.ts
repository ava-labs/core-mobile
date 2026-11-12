import {
  proceedOrWarnLowUptime,
  resetLowUptimeAlertState,
  showLowUptimeAlert
} from './showLowUptimeAlert'

const mockShowAlert = jest.fn()
jest.mock('@avalabs/k2-alpine', () => ({
  showAlert: (...args: unknown[]) => mockShowAlert(...args)
}))

type AlertButton = { text: string; onPress?: () => void }
const lastAlert = (): {
  title: string
  description: string
  buttons: AlertButton[]
} => mockShowAlert.mock.calls[mockShowAlert.mock.calls.length - 1][0]

describe('showLowUptimeAlert', () => {
  it('shows the Figma copy with Continue first and Select a new node second', () => {
    showLowUptimeAlert({ onContinue: jest.fn(), onSelectNewNode: jest.fn() })

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    const alert = lastAlert()
    expect(alert.title).toBe('Uptime too low')
    expect(alert.description).toBe(
      'This validator is below the 90% minimum uptime threshold and staking rewards may not be paid to delegators'
    )
    expect(alert.buttons.map(b => b.text)).toEqual([
      'Continue',
      'Select a new node'
    ])
  })

  it('is explicitly non-cancelable so a button is the only way out', () => {
    showLowUptimeAlert({ onContinue: jest.fn(), onSelectNewNode: jest.fn() })
    expect(mockShowAlert.mock.calls[0][0].options.cancelable).toBe(false)
  })

  it('wires each button to its callback', () => {
    const onContinue = jest.fn()
    const onSelectNewNode = jest.fn()
    showLowUptimeAlert({ onContinue, onSelectNewNode })

    lastAlert().buttons[0]?.onPress?.()
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onSelectNewNode).not.toHaveBeenCalled()

    lastAlert().buttons[1]?.onPress?.()
    expect(onSelectNewNode).toHaveBeenCalledTimes(1)
  })
})

describe('proceedOrWarnLowUptime', () => {
  afterEach(() => {
    resetLowUptimeAlertState()
  })

  it('proceeds immediately without an alert at or above the threshold', () => {
    const onProceed = jest.fn()
    proceedOrWarnLowUptime({
      uptime: '90',
      onProceed,
      onSelectNewNode: jest.fn()
    })
    expect(onProceed).toHaveBeenCalledTimes(1)
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it('proceeds immediately when uptime is unknown', () => {
    const onProceed = jest.fn()
    proceedOrWarnLowUptime({
      uptime: undefined,
      onProceed,
      onSelectNewNode: jest.fn()
    })
    expect(onProceed).toHaveBeenCalledTimes(1)
    expect(mockShowAlert).not.toHaveBeenCalled()
  })

  it('alerts and does not proceed below the threshold until Continue', () => {
    const onProceed = jest.fn()
    const onSelectNewNode = jest.fn()
    proceedOrWarnLowUptime({ uptime: 89.99, onProceed, onSelectNewNode })

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    expect(onProceed).not.toHaveBeenCalled()

    lastAlert().buttons[0]?.onPress?.()
    expect(onProceed).toHaveBeenCalledTimes(1)
    expect(onSelectNewNode).not.toHaveBeenCalled()
  })

  it('routes Select a new node without proceeding', () => {
    const onProceed = jest.fn()
    const onSelectNewNode = jest.fn()
    proceedOrWarnLowUptime({ uptime: '12', onProceed, onSelectNewNode })

    lastAlert().buttons[1]?.onPress?.()
    expect(onSelectNewNode).toHaveBeenCalledTimes(1)
    expect(onProceed).not.toHaveBeenCalled()
  })

  it('opens exactly one alert when called twice while it is open', () => {
    const args = {
      uptime: '85',
      onProceed: jest.fn(),
      onSelectNewNode: jest.fn()
    }
    proceedOrWarnLowUptime(args)
    proceedOrWarnLowUptime(args)
    expect(mockShowAlert).toHaveBeenCalledTimes(1)
  })

  it('opens a new alert after Continue was pressed', () => {
    const args = {
      uptime: '85',
      onProceed: jest.fn(),
      onSelectNewNode: jest.fn()
    }
    proceedOrWarnLowUptime(args)
    lastAlert().buttons[0]?.onPress?.()
    proceedOrWarnLowUptime(args)
    expect(mockShowAlert).toHaveBeenCalledTimes(2)
  })

  it('opens a new alert after Select a new node was pressed', () => {
    const args = {
      uptime: '85',
      onProceed: jest.fn(),
      onSelectNewNode: jest.fn()
    }
    proceedOrWarnLowUptime(args)
    lastAlert().buttons[1]?.onPress?.()
    proceedOrWarnLowUptime(args)
    expect(mockShowAlert).toHaveBeenCalledTimes(2)
  })
  it('clears the in-flight flag when the dialog is dismissed without a button', () => {
    const args = {
      uptime: '85',
      onProceed: jest.fn(),
      onSelectNewNode: jest.fn()
    }
    proceedOrWarnLowUptime(args)
    proceedOrWarnLowUptime(args)
    expect(mockShowAlert).toHaveBeenCalledTimes(1)

    mockShowAlert.mock.calls[0][0].options.onDismiss()
    proceedOrWarnLowUptime(args)
    expect(mockShowAlert).toHaveBeenCalledTimes(2)
    expect(args.onProceed).not.toHaveBeenCalled()
  })

  it('clears the in-flight flag when showAlert throws, so the next call still warns', () => {
    mockShowAlert.mockImplementationOnce(() => {
      throw new Error('alert host missing')
    })
    const args = {
      uptime: '50',
      onProceed: jest.fn(),
      onSelectNewNode: jest.fn()
    }
    expect(() => proceedOrWarnLowUptime(args)).toThrow('alert host missing')
    proceedOrWarnLowUptime(args)
    expect(mockShowAlert).toHaveBeenCalledTimes(2)
    expect(args.onProceed).not.toHaveBeenCalled()
  })
})
