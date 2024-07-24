import { ErrorBase } from 'errors/ErrorBase'

export enum ModuleErrors {
  UNSUPPORTED_CHAIN_ID = 'UNSUPPORTED_CHAIN_ID',
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  UNSUPPORTED_NAMESPACE = 'UNSUPPORTED_NAMESPACE',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR'
}

export class VmModuleErrors extends ErrorBase<ModuleErrors> {}
