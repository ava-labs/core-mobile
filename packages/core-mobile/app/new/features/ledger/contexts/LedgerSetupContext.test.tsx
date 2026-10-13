import React, { PropsWithChildren } from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { PermissionsAndroid } from 'react-native'
import BluetoothService from 'services/bluetooth/BluetoothService'
import {
  LedgerSetupProvider,
  useLedgerSetupContext
} from './LedgerSetupContext'

jest.mock('services/bluetooth/BluetoothService', () => ({
  __esModule: true,
  default: {
    observeBluetoothState: jest.fn()
  }
}))

jest.mock('services/ledger/LedgerService', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    disconnect: jest.fn()
  }
}))

describe('LedgerSetupProvider', () => {
  const wrapper = ({ children }: PropsWithChildren): JSX.Element => {
    return <LedgerSetupProvider>{children}</LedgerSetupProvider>
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(PermissionsAndroid, 'requestMultiple')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('does not observe BLE state or request permissions on mount', () => {
    const { result } = renderHook(() => useLedgerSetupContext(), { wrapper })

    expect(result.current.isConnecting).toBe(false)
    expect(BluetoothService.observeBluetoothState).not.toHaveBeenCalled()
    expect(PermissionsAndroid.requestMultiple).not.toHaveBeenCalled()
  })
})
