import { IdentityProof } from '@cubist-labs/cubesigner-sdk'
import { SeedlessUserRegistrationResult } from 'seedless/services/CoreSeedlessAPIService'

export interface CoreSeedlessApiInterface {
  register(
    identityProof: IdentityProof
  ): Promise<SeedlessUserRegistrationResult>

  addAccount({
    accountIndex,
    identityProof,
    mnemonicId
  }: {
    accountIndex: number
    identityProof: IdentityProof
    mnemonicId: string
  }): Promise<void>

  deriveMissingKeys({
    identityProof,
    mnemonicId
  }: {
    identityProof: IdentityProof
    mnemonicId: string
  }): Promise<void>
}
