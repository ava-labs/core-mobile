import { ErrorBase } from 'errors/ErrorBase'

type TotpErrorName = 'RequiresMfa' | 'WrongMfaCode' | 'UnexpectedError'
export class TotpErrors extends ErrorBase<TotpErrorName> {}

type RefreshSeedlessTokenFlowErrorName =
  | 'UNSUPPORTED_OIDC_PROVIDER'
  | 'USER_ID_MISMATCH'
  | 'NOT_REGISTERED'
  | 'USER_CANCELED'
  | 'UNEXPECTED_ERROR'

export class RefreshSeedlessTokenFlowErrors extends ErrorBase<RefreshSeedlessTokenFlowErrorName> {}
