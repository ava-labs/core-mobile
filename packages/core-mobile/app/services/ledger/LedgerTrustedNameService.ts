import Transport from '@ledgerhq/hw-transport'
import { StatusCodes } from '@ledgerhq/errors'
import type AppSolana from '@ledgerhq/hw-app-solana'
import Logger from 'utils/Logger'

const CAL_SERVICE_URL = 'https://crypto-assets-service.api.ledger.com'
const TRUST_SERVICE_URL = 'https://nft.api.live.ledger.com'

const SPL_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const SPL_TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'

const TRANSFER_CHECKED_DISCRIMINATOR = 12
const CREATE_ATA_IDEMPOTENT_DISCRIMINATOR = 1

const PKI_CLA = 0xb0
const PKI_INS = 0x06
const PKI_KEY_USAGE_TRUSTED_NAME = 0x04

const DEVICE_MODEL_MAP: Record<string, string> = {
  nanoS: 'nanos',
  nanoSP: 'nanosp',
  nanoX: 'nanox',
  stax: 'stax',
  europa: 'flex',
  flex: 'flex',
  apex: 'apexp'
}

export interface SplTransferInfo {
  destATA: string
  mintAddress: string
  ownerAddress?: string
  needsCreateATA: boolean
}

/**
 * Extract SPL transfer info from a decompiled Solana transaction message.
 * Returns null if the transaction does not contain a TransferChecked instruction.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractSplTransferInfo(txMessage: any): SplTransferInfo | null {
  const instructions = txMessage?.instructions
  if (!Array.isArray(instructions)) return null

  let transferCheckedIx = null
  let createATAIx = null

  for (const ix of instructions) {
    const programAddr = ix.programAddress ?? ix.programId?.toString?.()
    if (!programAddr) continue

    if (
      programAddr === SPL_TOKEN_PROGRAM ||
      programAddr === SPL_TOKEN_2022_PROGRAM
    ) {
      const data = ix.data
      if (
        data instanceof Uint8Array &&
        data[0] === TRANSFER_CHECKED_DISCRIMINATOR
      ) {
        transferCheckedIx = ix
      }
    }

    if (programAddr === ATA_PROGRAM) {
      const data = ix.data
      const isCreateIdempotent =
        data instanceof Uint8Array &&
        data[0] === CREATE_ATA_IDEMPOTENT_DISCRIMINATOR
      const isCreateWithNoData =
        !data || (data instanceof Uint8Array && data.length === 0)
      if (isCreateIdempotent || isCreateWithNoData) {
        createATAIx = ix
      }
    }
  }

  if (!transferCheckedIx) return null

  const accounts = transferCheckedIx.accounts
  if (!accounts || accounts.length < 4) return null

  const mintAddress = accounts[1]?.address?.toString?.() ?? String(accounts[1])
  const destATA = accounts[2]?.address?.toString?.() ?? String(accounts[2])

  if (createATAIx) {
    const ataAccounts = createATAIx.accounts
    if (ataAccounts && ataAccounts.length >= 4) {
      const ownerAddress =
        ataAccounts[2]?.address?.toString?.() ?? String(ataAccounts[2])
      return { destATA, mintAddress, ownerAddress, needsCreateATA: true }
    }
  }

  return { destATA, mintAddress, needsCreateATA: false }
}

function getDeviceModelName(transport: Transport): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = transport as any
  const model = t.deviceModel
  const deviceName: string | undefined =
    t.device?.name ?? t.device?.localName ?? t.deviceName
  Logger.info(
    `[LedgerSPL] transport props: deviceModel.id=${model?.id ?? 'N/A'}, deviceName=${deviceName ?? 'N/A'}`
  )

  if (model?.id && DEVICE_MODEL_MAP[model.id]) {
    return DEVICE_MODEL_MAP[model.id]!
  }

  if (deviceName) {
    const name = deviceName.toLowerCase()
    if (name.includes('gen 5') || name.includes('apex')) return 'apexp'
    if (name.includes('flex')) return 'flex'
    if (name.includes('stax')) return 'stax'
    if (name.includes('nano x')) return 'nanox'
    if (name.includes('nano s plus') || name.includes('nano sp')) return 'nanosp'
  }

  // BLE-only devices: default to nanox (most common)
  Logger.info('[LedgerSPL] Could not detect model, defaulting to nanox')
  return 'nanox'
}

async function fetchPKICertificate(
  deviceModelName: string
): Promise<{ descriptor: string; signature: string }> {
  const params = new URLSearchParams({
    output:
      'id,target_device,not_valid_after,public_key_usage,certificate_version,descriptor',
    target_device: deviceModelName,
    public_key_usage: 'trusted_name',
    public_key_id: 'domain_metadata_key',
    latest: 'true'
  })

  const response = await fetch(`${CAL_SERVICE_URL}/v1/certificates?${params}`)
  if (!response.ok) {
    throw new Error(
      `CAL certificate fetch failed: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No PKI certificate returned from CAL service')
  }

  return {
    descriptor: data[0].descriptor.data,
    signature: data[0].descriptor.signatures.prod
  }
}

async function loadPKICertificate(
  transport: Transport,
  descriptor: string,
  signature: string
): Promise<void> {
  const descriptorBytes = new Uint8Array(Buffer.from(descriptor, 'hex'))
  const signatureBytes = new Uint8Array(Buffer.from(signature, 'hex'))
  const tag = new Uint8Array([0x15, signatureBytes.length])

  const payload = Buffer.from(
    new Uint8Array([...descriptorBytes, ...tag, ...signatureBytes])
  )

  await transport.send(
    PKI_CLA,
    PKI_INS,
    PKI_KEY_USAGE_TRUSTED_NAME,
    0x00,
    payload,
    [StatusCodes.OK]
  )
}

async function fetchSignedDescriptor(
  splInfo: SplTransferInfo,
  challenge: string
): Promise<string | undefined> {
  let url: string

  if (splInfo.needsCreateATA && splInfo.ownerAddress) {
    url = `${TRUST_SERVICE_URL}/v2/solana/computed-token-account/${splInfo.ownerAddress}/${splInfo.mintAddress}?challenge=${challenge}`
  } else {
    url = `${TRUST_SERVICE_URL}/v2/solana/owner/${splInfo.destATA}?challenge=${challenge}`
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Trust service fetch failed: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return data.signedDescriptor
}

/**
 * Provide trusted name info to the Ledger device for an SPL token transfer.
 * This enables clear signing instead of blind signing for TransferChecked instructions.
 *
 * The flow:
 * 1. Fetch PKI certificate from CAL service
 * 2. Load PKI certificate onto the device
 * 3. Get a challenge from the device
 * 4. Fetch signed descriptor from the trust service
 * 5. Send the signed descriptor to the device via provideTrustedName
 */
export async function enrollTrustedName(
  transport: Transport,
  solanaApp: AppSolana,
  splInfo: SplTransferInfo
): Promise<void> {
  const deviceModelName = getDeviceModelName(transport)
  Logger.info(`[LedgerSPL] Step 1: device model = ${deviceModelName}`)

  const { descriptor, signature } =
    await fetchPKICertificate(deviceModelName)
  Logger.info(
    `[LedgerSPL] Step 2: PKI cert fetched (desc ${descriptor.length} chars, sig ${signature.length} chars)`
  )

  await loadPKICertificate(transport, descriptor, signature)
  Logger.info('[LedgerSPL] Step 3: PKI cert loaded onto device')

  const challenge = await solanaApp.getChallenge()
  Logger.info(`[LedgerSPL] Step 4: challenge = ${challenge}`)

  const signedDescriptor = await fetchSignedDescriptor(splInfo, challenge)
  Logger.info(
    `[LedgerSPL] Step 5: signed descriptor = ${signedDescriptor ? `${signedDescriptor.length} chars` : 'MISSING'}`
  )

  if (signedDescriptor) {
    await solanaApp.provideTrustedName(signedDescriptor)
    Logger.info('[LedgerSPL] Step 6: provideTrustedName succeeded')
  } else {
    Logger.info('[LedgerSPL] Step 5: No signed descriptor returned')
  }
}
