import { ErrorBase } from 'errors/ErrorBase'

type TotpErrorName = 'RequiresMfa' | 'WrongMfaCode' | 'UnexpectedError'
export class TotpErrors extends ErrorBase<TotpErrorName> {}
