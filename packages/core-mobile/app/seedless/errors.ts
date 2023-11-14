import { ErrorBase } from 'errors/ErrorBase'

type TotpErrorName = 'RequiresMfa' | 'WrongMfaCode'
export class TotpErrors extends ErrorBase<TotpErrorName> {}
