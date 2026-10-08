import { act, renderHook } from '@testing-library/react-hooks'
import { useDispatch } from 'react-redux'
import { importMnemonicWalletAndAccount } from 'store/wallet/thunks'
import { useImportMnemonic } from './useImportMnemonic'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn()
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => false }),
  useNavigation: () => ({ getParent: () => undefined })
}))

jest.mock('new/common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

jest.mock('store/wallet/thunks', () => ({
  importMnemonicWalletAndAccount: jest.fn()
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() }
}))

const VALID_PHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe('useImportMnemonic', () => {
  const mockDispatch = jest.fn()
  const mockThunk = importMnemonicWalletAndAccount as unknown as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch)
    mockThunk.mockImplementation(args => ({ type: 'mock/import', args }))
    mockDispatch.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ walletId: 'w1' })
    })
  })

  it('passes the normalized phrase to the import thunk', async () => {
    const { result } = renderHook(() => useImportMnemonic())

    await act(async () => {
      await result.current.importWallet(
        '  Abandon abandon  abandon abandon abandon abandon abandon abandon abandon abandon abandon  About ',
        'My wallet'
      )
    })

    expect(mockThunk).toHaveBeenCalledWith({
      mnemonic: VALID_PHRASE,
      name: 'My wallet'
    })
  })

  it('does not dispatch for an invalid phrase', async () => {
    const { result } = renderHook(() => useImportMnemonic())

    await act(async () => {
      await result.current.importWallet('not a valid phrase')
    })

    expect(mockThunk).not.toHaveBeenCalled()
  })
})
