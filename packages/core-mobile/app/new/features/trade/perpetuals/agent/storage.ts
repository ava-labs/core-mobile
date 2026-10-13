import SecureStorageService, { KeySlot } from 'security/SecureStorageService'

/**
 * Ephemeral Hyperliquid agent (session) key for a single user master wallet.
 * The private key never leaves the device's secure keychain and is only used
 * to sign L1 actions in-process via `createAgentSigner`.
 */
export type PerpsAgentRecord = {
  readonly privateKey: string
  readonly userAddress: string
}

type AgentStore = Record<string, PerpsAgentRecord>

const keyOf = (userAddress: string): string => userAddress.toLowerCase()

const loadAll = async (): Promise<AgentStore> => {
  try {
    return await SecureStorageService.load<AgentStore>(KeySlot.PerpsAgents)
  } catch {
    // No value stored yet (SecureStorageService throws when the slot is empty).
    return {}
  }
}

export const loadAgentFromStorage = async (
  userAddress: string
): Promise<PerpsAgentRecord | undefined> => {
  const all = await loadAll()
  return all[keyOf(userAddress)]
}

export const saveAgentToStorage = async (
  userAddress: string,
  record: PerpsAgentRecord
): Promise<void> => {
  const all = await loadAll()
  all[keyOf(userAddress)] = record
  await SecureStorageService.store(KeySlot.PerpsAgents, all)
}

export const clearAgentFromStorage = async (
  userAddress: string
): Promise<void> => {
  const all = await loadAll()
  delete all[keyOf(userAddress)]
  await SecureStorageService.store(KeySlot.PerpsAgents, all)
}
