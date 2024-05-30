import { ErrorBase } from 'errors/ErrorBase'

export enum ModuleErrors {
  unsupportedChainId = 'UNSUPPORTED_CHAIN_ID',
  unsupportedMethod = 'UNSUPPORTED_METHOD',
  unsupportedNamespace = 'UNSUPPORTED_NAMESPACE',
  unexpectedError = 'UNEXPECTED_ERROR'
}

export class VmModuleErrors extends ErrorBase<ModuleErrors> {}
