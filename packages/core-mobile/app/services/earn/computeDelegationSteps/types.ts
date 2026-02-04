export enum Operation {
  EXPORT_C = 'exportC',
  IMPORT_P = 'importP',
  DELEGATE = 'delegate',
  // Claim-specific operations (P → C direction)
  EXPORT_P = 'exportP',
  IMPORT_C = 'importC'
}

export type ExportC = {
  operation: Operation.EXPORT_C
  amount: bigint
  fee: bigint
}

export type ImportP = {
  operation: Operation.IMPORT_P
  fee: bigint
}

export type Delegate = {
  operation: Operation.DELEGATE
  amount: bigint
  fee: bigint
}

// Claim-specific step types (P → C direction)
export type ExportP = {
  operation: Operation.EXPORT_P
  amount: bigint
  fee: bigint
}

export type ImportC = {
  operation: Operation.IMPORT_C
  fee: bigint
}

export type Step = ExportC | ImportP | Delegate

// Claim steps (P → C direction)
export type ClaimStep = ExportP | ImportC

export type Case = {
  title: string
  description: string
  execute: () => Promise<Step[]>
}

export type ClaimCase = {
  title: string
  description: string
  execute: () => Promise<ClaimStep[]>
}
