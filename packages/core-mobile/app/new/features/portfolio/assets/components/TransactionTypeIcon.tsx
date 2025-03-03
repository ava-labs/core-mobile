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
  Swap: Icons.Custom.Compare,
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
  RewardValidatorTx: Icons.Custom.Psychiatry,
  AdvanceTimeTx: Icons.Custom.AdvanceTime,
  Bridge: Icons.Custom.Bridge,
  Approve: Icons.Custom.CheckSmall,
  Transfer: Icons.Custom.Compare,
  FillOrder: Icons.Custom.CheckSmall,
  Unwrap: Icons.Custom.Unwrap,
  ConvertSubnetToL1Tx: Icons.Custom.Subnet,
  RegisterL1ValidatorTx: Icons.Custom.Psychiatry,
  SetL1ValidatorWeightTx: Icons.Custom.Psychiatry,
  DisableL1ValidatorTx: Icons.Custom.Psychiatry,
  IncreaseL1ValidatorBalanceTx: Icons.Custom.Psychiatry,

  NFTBuy: undefined,
  NFTReceive: undefined,
  NFTSend: undefined,
  UNKNOWN: undefined
}
