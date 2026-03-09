import Transport from '@ledgerhq/hw-transport'
import { StatusCodes } from '@ledgerhq/errors'
import type AppSolana from '@ledgerhq/hw-app-solana'
import Logger from 'utils/Logger'

const CAL_SERVICE_URL = 'https://crypto-assets-service.api.ledger.com'
const TRUST_SERVICE_URL = 'https://nft.api.live.ledger.com'

const SPL_TOKEN_PROGRAMS = new Set([
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
])
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

const BLE_NAME_PATTERNS: ReadonlyArray<[string, string]> = [
  ['gen 5', 'apexp'],
  ['apex', 'apexp'],
  ['flex', 'flex'],
  ['stax', 'stax'],
  ['nano x', 'nanox'],
  ['nano s plus', 'nanosp'],
  ['nano sp', 'nanosp']
]

export interface SplTransferInfo {
  destATA: string
  mintAddress: string
  ownerAddress?: string
  needsCreateATA: boolean
}

class LedgerTrustedNameService {
  /**
   * Extract SPL transfer info from a decompiled Solana transaction message.
   * Returns null if the transaction does not contain a TransferChecked instruction.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static extractSplTransferInfo(txMessage: any): SplTransferInfo | null {
    const instructions = txMessage?.instructions
    if (!Array.isArray(instructions)) return null

    const transferIx = instructions.find((ix: unknown) => {
      const addr = this.getProgramAddress(ix)
      return (
        addr &&
        SPL_TOKEN_PROGRAMS.has(addr) &&
        this.isTransferChecked((ix as Record<string, unknown>).data)
      )
    })
    if (!transferIx) return null

    const accounts = transferIx.accounts
    if (!accounts || accounts.length < 4) return null

    const mintAddress = this.getAccountAddress(accounts[1])
    const destATA = this.getAccountAddress(accounts[2])

    const createATAIx = instructions.find((ix: unknown) => {
      const addr = this.getProgramAddress(ix)
      return (
        addr === ATA_PROGRAM &&
        this.isCreateATA((ix as Record<string, unknown>).data)
      )
    })

    if (createATAIx?.accounts?.length >= 4) {
      return {
        destATA,
        mintAddress,
        ownerAddress: this.getAccountAddress(createATAIx.accounts[2]),
        needsCreateATA: true
      }
    }

    return { destATA, mintAddress, needsCreateATA: false }
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
  static async enrollTrustedName(
    transport: Transport,
    solanaApp: AppSolana,
    splInfo: SplTransferInfo
  ): Promise<void> {
    const deviceModelName = this.getDeviceModelName(transport)

    const { descriptor, signature } = await this.fetchPKICertificate(
      deviceModelName
    )
    await this.loadPKICertificate(transport, descriptor, signature)

    const challenge = await solanaApp.getChallenge()
    const signedDescriptor = await this.fetchSignedDescriptor(
      splInfo,
      challenge
    )

    if (signedDescriptor) {
      await solanaApp.provideTrustedName(signedDescriptor)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getProgramAddress(ix: any): string | undefined {
    return ix.programAddress ?? ix.programId?.toString?.()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getAccountAddress(account: any): string {
    return account?.address?.toString?.() ?? String(account)
  }

  private static isTransferChecked(data: unknown): boolean {
    return (
      data instanceof Uint8Array && data[0] === TRANSFER_CHECKED_DISCRIMINATOR
    )
  }

  private static isCreateATA(data: unknown): boolean {
    if (!(data instanceof Uint8Array)) return !data
    return data.length === 0 || data[0] === CREATE_ATA_IDEMPOTENT_DISCRIMINATOR
  }

  private static getDeviceModelName(transport: Transport): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = transport as any
    const modelId: string | undefined = t.deviceModel?.id

    if (modelId && DEVICE_MODEL_MAP[modelId]) {
      return DEVICE_MODEL_MAP[modelId]!
    }

    const deviceName: string | undefined =
      t.device?.name ?? t.device?.localName ?? t.deviceName

    if (deviceName) {
      const name = deviceName.toLowerCase()
      const match = BLE_NAME_PATTERNS.find(([pattern]) =>
        name.includes(pattern)
      )
      if (match?.[1]) return match[1]
    }

    Logger.info('[LedgerSPL] Could not detect model, defaulting to nanox')
    return 'nanox'
  }

  private static async fetchPKICertificate(
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

  private static async loadPKICertificate(
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

  private static async fetchSignedDescriptor(
    splInfo: SplTransferInfo,
    challenge: string
  ): Promise<string | undefined> {
    const path =
      splInfo.needsCreateATA && splInfo.ownerAddress
        ? `computed-token-account/${splInfo.ownerAddress}/${splInfo.mintAddress}`
        : `owner/${splInfo.destATA}`

    const response = await fetch(
      `${TRUST_SERVICE_URL}/v2/solana/${path}?challenge=${challenge}`
    )
    if (!response.ok) {
      throw new Error(
        `Trust service fetch failed: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    return data.signedDescriptor
  }
}

export default LedgerTrustedNameService
