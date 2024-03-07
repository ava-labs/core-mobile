import SeedlessService from 'seedless/services/SeedlessService'

const MOCK_SESSION_KEYS_LIST = [
  {
    key_id: 'key_id_mnemonic',
    key_type: 'Mnemonic',
    enabled: true,
    purpose: 'purpose'
  },
  {
    key_id: 'key_id_stark',
    key_type: 'Stark',
    enabled: true,
    purpose: 'purpose'
  }
]
jest
  .spyOn(SeedlessService.sessionManager, 'getSignerSession')
  // @ts-ignore
  .mockImplementation(() => {
    return {
      sessionKeysList: jest.fn().mockReturnValue(MOCK_SESSION_KEYS_LIST)
    }
  })

describe('SeedlessService', () => {
  it('should have returned the list of keys that this session has access to', async () => {
    const keysList = await SeedlessService.getSessionKeysList()
    expect(keysList).toEqual(MOCK_SESSION_KEYS_LIST)
  })
  it('should have returned Mnemonic keys that this session has access to', async () => {
    const keysList = await SeedlessService.getMnemonicKeysList()
    expect(keysList).toEqual(MOCK_SESSION_KEYS_LIST[0])
  })
})
