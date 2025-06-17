// @ts-nocheck
import SeedlessService from 'seedless/services/SeedlessService'
import { ACCOUNT_NAME } from 'seedless/consts'

const MOCK_SESSION_KEYS_LIST = [
  {
    created: 1710169385,
    derivation_info: {
      derivation_path: "m/44'/9'/0'/0/0",
      mnemonic_id: '0x1'
    },
    enabled: true,
    key_id: 'Key#key_id_mnemonic',
    key_type: 'Mnemonic',
    last_modified: 1710169395,
    material_id: 'mnemonic_test_1',
    owner: 'User#test-user',
    policy: ['AllowRawBlobSigning'],
    public_key: '0x_test_pk_1',
    purpose: 'mnemonic',
    version: 1
  },
  {
    created: 1710169347,
    derivation_info: {
      derivation_path: "m/44'/9000'/0'/0/0",
      mnemonic_id: '0x0'
    },
    enabled: true,
    key_id: 'Key#Ava_avax_test_0',
    key_type: 'SecpAvaAddr',
    last_modified: 1710169408,
    material_id: 'avax_test_0',
    metadata: { account_name: 'test 1' },
    owner: 'User#test-user',
    policy: ['AllowRawBlobSigning'],
    public_key: '0x_test_pk_2',
    purpose: 'Ava',
    version: 2
  },
  {
    created: 1710169347,
    derivation_info: {
      derivation_path: "m/44'/9000'/0'/0/1",
      mnemonic_id: '0x0'
    },
    enabled: true,
    key_id: 'Key#Ava_avax_test_2',
    key_type: 'SecpAvaAddr',
    last_modified: 1710169408,
    material_id: 'avax_test_2',
    owner: 'User#test-user',
    policy: ['AllowRawBlobSigning'],
    public_key: '0x_test_pk_3',
    purpose: 'Ava',
    version: 2
  },
  {
    created: 1710169385,
    derivation_info: {
      derivation_path: "m/44'/9000'/0'/0/2",
      mnemonic_id: '0x1'
    },
    enabled: true,
    key_id: 'Key#Ava_avax_test_1',
    key_type: 'SecpAvaAddr',
    last_modified: 1710169395,
    material_id: 'avax_test_1',
    owner: 'User#test-user',
    metadata: 'test',
    policy: ['AllowRawBlobSigning'],
    public_key: '0x_test_pk_1',
    purpose: 'Ava',
    version: 1
  }
]

const mockSessionKeysList = jest.fn()

jest
  .spyOn(SeedlessService.session, 'getSignerClient')
  .mockImplementation(() => {
    return {
      apiClient: {
        sessionKeysList: mockSessionKeysList.mockReturnValue(
          MOCK_SESSION_KEYS_LIST
        )
      }
    }
  })

const mockSetMetadataProperty = jest.fn()
jest.spyOn(SeedlessService.session, 'getKey').mockImplementation(() => {
  return {
    setMetadataProperty: mockSetMetadataProperty
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

  describe('getAccountName', () => {
    it('should have returned account name for the primary signing key', async () => {
      const keysList = await SeedlessService.getAccountName(0)
      expect(keysList).toEqual(
        MOCK_SESSION_KEYS_LIST[1]?.metadata?.account_name
      )
    })
    it('should have returned undefined if metadata does not exist', async () => {
      const keysList = await SeedlessService.getAccountName(1)
      expect(keysList).toBeUndefined()
    })
    it('should have returned undefined if metadata is typeof string', async () => {
      const keysList = await SeedlessService.getAccountName(2)
      expect(keysList).toBeUndefined()
    })
    it('should have thrown if key type SecpAvaAddr does not exist', async () => {
      mockSessionKeysList.mockRejectedValueOnce(new Error('rejected'))
      try {
        await SeedlessService.getAccountName(0)
      } catch (error) {
        expect((error as Error).message).toBe(
          `Failed to get name for the account index, ${error}`
        )
      }
    })
  })

  describe('setAcountName', () => {
    it('should have set account name correctly', async () => {
      await SeedlessService.setAccountName('test', 0)
      expect(mockSetMetadataProperty).toHaveBeenCalledWith(ACCOUNT_NAME, 'test')
    })
    it('should have thrown if key type SecpAvaAddr does not exist', async () => {
      mockSessionKeysList.mockRejectedValueOnce(new Error('rejected'))
      try {
        await SeedlessService.setAccountName('test', 0)
      } catch (error) {
        expect((error as Error).message).toBe(
          `Failed to set metadata, ${error}`
        )
      }
    })
    it('should have thrown if key info does not exist in account index', async () => {
      try {
        await SeedlessService.setAccountName('test', 100)
      } catch (error) {
        expect((error as Error).message).toBe(
          `Failed to set metadata, ${error}`
        )
      }
    })
  })
})
