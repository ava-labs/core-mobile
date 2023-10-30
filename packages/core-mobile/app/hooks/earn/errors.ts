import { ErrorBase } from 'errors/ErrorBase'

type FundsStuckErrorName =
  | 'CONFIRM_EXPORT_FAIL'
  | 'ISSUE_IMPORT_FAIL'
  | 'CONFIRM_IMPORT_FAIL'

export class FundsStuckError extends ErrorBase<FundsStuckErrorName> {}
