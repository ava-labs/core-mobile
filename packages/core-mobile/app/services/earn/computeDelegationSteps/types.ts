export enum Operation {
  EXPORT_C = 'exportC',
  IMPORT_P = 'importP',
  DELEGATE = 'delegate'
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

export type Step = ExportC | ImportP | Delegate

export type Case = {
  title: string
  description: string
  execute: () => Promise<Step[]>
}
