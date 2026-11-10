import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { onLogIn } from 'store/app'
import { setActive } from 'store/network'
import { setActiveAccountId } from 'store/account'
import { AppListenerEffectAPI } from 'store/types'
import { UPDATE_SESSION_DELAY } from 'consts/walletConnect'
import {
  handleAccountChange,
  handleNetworkChange,
  initWalletConnect
} from './sessions'

const mockAccount = { id: 'account-1', addressC: '0xabc' }

jest.mock('services/walletconnectv2/WalletConnectService')

jest.mock('store/account', () => ({
  ...jest.requireActual('store/account'),
  selectActiveAccount: () => mockAccount
}))

jest.mock('store/network', () => ({
  ...jest.requireActual('store/network'),
  selectActiveNetwork: () => ({ chainId: 43114 })
}))

const listenerApi = {
  getState: () => ({}),
  dispatch: jest.fn()
} as unknown as AppListenerEffectAPI

const updateSessions = WalletConnectService.updateSessions as jest.Mock

// CP-15152: only a real account switch may add the active account to sessions
describe('WC session listeners', () => {
  beforeEach(() => {
    updateSessions.mockReset().mockResolvedValue(undefined)
  })

  it('handleAccountChange adds the active account', async () => {
    await handleAccountChange(setActiveAccountId('account-1'), listenerApi)

    expect(updateSessions).toHaveBeenCalledWith({
      chainId: 43114,
      account: mockAccount,
      addActiveAccount: true
    })
  })

  it('handleNetworkChange does not add the active account', async () => {
    await handleNetworkChange(setActive(1), listenerApi)

    expect(updateSessions).toHaveBeenCalledTimes(1)
    expect(updateSessions.mock.calls[0][0].addActiveAccount).not.toBe(true)
  })

  it('initWalletConnect does not add the active account', async () => {
    jest.useFakeTimers()
    try {
      await initWalletConnect(onLogIn(), listenerApi)
      expect(updateSessions).not.toHaveBeenCalled()

      jest.advanceTimersByTime(UPDATE_SESSION_DELAY)

      expect(updateSessions).toHaveBeenCalledTimes(1)
      expect(updateSessions.mock.calls[0][0].addActiveAccount).not.toBe(true)
    } finally {
      jest.useRealTimers()
    }
  })
})
