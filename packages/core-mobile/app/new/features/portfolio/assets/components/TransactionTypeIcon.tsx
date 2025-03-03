import React, { useMemo } from 'react'
import { Icons, useTheme } from '@avalabs/k2-alpine'
import { ActivityTransactionType } from 'store/transaction'
import { SvgProps } from 'react-native-svg'

export interface TransactionTypeIconProp {
  txType?: ActivityTransactionType
  isContractCall: boolean
}

export const TransactionTypeIcon = ({
  txType,
  isContractCall
}: TransactionTypeIconProp): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const Icon = useMemo(() => {
    if (txType && METHOD_NAME_TO_ICON[txType]) {
      return METHOD_NAME_TO_ICON[txType]
    }
    if (isContractCall) return Icons.TransactionTypes.ContractCall
    return Icons.TransactionTypes.Unknown
  }, [txType, isContractCall])

  return <Icon color={colors.$textPrimary} />
}

const METHOD_NAME_TO_ICON: Record<
  ActivityTransactionType,
  React.FC<SvgProps> | undefined
> = {
  Swap: Icons.TransactionTypes.Swap,
  Send: Icons.TransactionTypes.Send,
  Receive: Icons.TransactionTypes.Receive,
  Airdrop: Icons.TransactionTypes.Airdrop,
  ImportTx: Icons.TransactionTypes.Receive,
  ExportTx: Icons.TransactionTypes.Send,
  BaseTx: Icons.TransactionTypes.ContractCall,
  CreateAssetTx: Icons.TransactionTypes.Subnet,
  OperationTx: Icons.TransactionTypes.ContractCall,
  AddPermissionlessDelegatorTx: Icons.TransactionTypes.Add,
  AddValidatorTx: Icons.TransactionTypes.Add,
  AddSubnetValidatorTx: Icons.TransactionTypes.Subnet,
  TransferSubnetOwnershipTx: Icons.TransactionTypes.Subnet,
  AddDelegatorTx: Icons.TransactionTypes.Add,
  CreateSubnetTx: Icons.TransactionTypes.Subnet,
  CreateChainTx: Icons.TransactionTypes.Add,
  TransformSubnetTx: Icons.TransactionTypes.Subnet,
  AddPermissionlessValidatorTx: Icons.TransactionTypes.Add,
  RemoveSubnetValidatorTx: Icons.TransactionTypes.Subnet,
  RewardValidatorTx: Icons.TransactionTypes.Stake,
  AdvanceTimeTx: Icons.TransactionTypes.AdvanceTime,
  Bridge: Icons.TransactionTypes.Bridge,
  Approve: Icons.TransactionTypes.Approve,
  Transfer: Icons.TransactionTypes.Swap,
  FillOrder: Icons.TransactionTypes.Approve,
  Unwrap: Icons.TransactionTypes.Unwrap,
  ConvertSubnetToL1Tx: Icons.TransactionTypes.Subnet,
  RegisterL1ValidatorTx: Icons.TransactionTypes.Stake,
  SetL1ValidatorWeightTx: Icons.TransactionTypes.Stake,
  DisableL1ValidatorTx: Icons.TransactionTypes.Stake,
  IncreaseL1ValidatorBalanceTx: Icons.TransactionTypes.Stake,

  NFTBuy: undefined,
  NFTReceive: undefined,
  NFTSend: undefined,
  UNKNOWN: undefined
}
