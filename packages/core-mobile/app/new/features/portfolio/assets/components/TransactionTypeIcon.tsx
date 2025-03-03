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
    if (isContractCall) return Icons.Custom.ContractCall
    return Icons.Custom.Unknown
  }, [txType, isContractCall])

  return <Icon color={colors.$textPrimary} />
}

const METHOD_NAME_TO_ICON: Record<
  ActivityTransactionType,
  React.FC<SvgProps> | undefined
> = {
  Swap: Icons.Custom.Swap,
  Send: Icons.Custom.TxTypeSend,
  Receive: Icons.Custom.Receive,
  Airdrop: Icons.Custom.Airdrop,
  ImportTx: Icons.Custom.Receive,
  ExportTx: Icons.Custom.TxTypeSend,
  BaseTx: Icons.Custom.ContractCall,
  CreateAssetTx: Icons.Custom.Subnet,
  OperationTx: Icons.Custom.ContractCall,
  AddPermissionlessDelegatorTx: Icons.Custom.TxTypeAdd,
  AddValidatorTx: Icons.Custom.TxTypeAdd,
  AddSubnetValidatorTx: Icons.Custom.Subnet,
  TransferSubnetOwnershipTx: Icons.Custom.Subnet,
  AddDelegatorTx: Icons.Custom.TxTypeAdd,
  CreateSubnetTx: Icons.Custom.Subnet,
  CreateChainTx: Icons.Custom.TxTypeAdd,
  TransformSubnetTx: Icons.Custom.Subnet,
  AddPermissionlessValidatorTx: Icons.Custom.TxTypeAdd,
  RemoveSubnetValidatorTx: Icons.Custom.Subnet,
  RewardValidatorTx: Icons.Custom.Stake,
  AdvanceTimeTx: Icons.Custom.AdvanceTime,
  Bridge: Icons.Custom.Bridge,
  Approve: Icons.Custom.Approve,
  Transfer: Icons.Custom.Swap,
  FillOrder: Icons.Custom.Approve,
  Unwrap: Icons.Custom.Unwrap,
  ConvertSubnetToL1Tx: Icons.Custom.Subnet,
  RegisterL1ValidatorTx: Icons.Custom.Stake,
  SetL1ValidatorWeightTx: Icons.Custom.Stake,
  DisableL1ValidatorTx: Icons.Custom.Stake,
  IncreaseL1ValidatorBalanceTx: Icons.Custom.Stake,

  NFTBuy: undefined,
  NFTReceive: undefined,
  NFTSend: undefined,
  UNKNOWN: undefined
}
