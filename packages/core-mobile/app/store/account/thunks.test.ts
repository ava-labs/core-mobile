import {
  UNSUPPORTED_WALLET_TYPE_ERROR,
  WalletType
} from 'services/wallet/types'
import AccountsService from 'services/account/AccountsService'
import { RootState } from 'store/types'
import { addAccount } from './thunks'

jest.mock('services/account/AccountsService')
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))
jest.mock('store/settings/advanced/slice', () => ({
  selectIsDeveloperMode: jest.fn().mockReturnValue(false)
}))

describe('account thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addAccount', () => {
    const walletId = 'wallet-keystone-1'

    const mockState: Partial<RootState> = {
      wallet: {
        wallets: {
          [walletId]: {
            id: walletId,
            name: 'Keystone wallet',
            type: WalletType.KEYSTONE
          }
        },
        activeWalletId: walletId,
        isMigratingActiveAccounts: false
      },
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: {}
      }
    }

    it('rejects a Keystone wallet without calling AccountsService', async () => {
      const mockGetState = jest.fn().mockReturnValue(mockState)
      const mockDispatch = jest.fn()

      const result = (await addAccount(walletId)(
        mockDispatch,
        mockGetState,
        undefined
      )) as { type: string; error: { message: string } }

      expect(result.type).toBe('account/addAccount/rejected')
      expect(result.error.message).toBe(UNSUPPORTED_WALLET_TYPE_ERROR)
      expect(AccountsService.createNextAccount).not.toHaveBeenCalled()
    })
  })
})
