import { ErrorBase } from 'errors/ErrorBase'

type ErrorName =
  | 'CONFIRM_EXPORT_FAIL'
  | 'ISSUE_IMPORT_FAIL'
  | 'CONFIRM_IMPORT_FAIL'

export class EarnError extends ErrorBase<ErrorName> {}
