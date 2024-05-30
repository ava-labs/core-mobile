import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/glacier-sdk'
import { useMemo } from 'react'
import React from 'react'
import ArrowDownLeft from 'assets/icons/arrowDownLeft.svg'
import ArrowUpRight from 'assets/icons/arrowUpRight.svg'
import ArrowRight from 'assets/icons/arrowRight.svg'
import AirDrop from 'assets/icons/airdrop.svg'
import AddUser from 'assets/icons/addUser.svg'
import Share from 'assets/icons/share2.svg'
import Blockchain from 'assets/icons/blockchain.svg'
import MinusCircle from 'assets/icons/minusCircle.svg'
import Clock from 'assets/icons/clock.svg'
import HelpCircle from 'assets/icons/helpCircle.svg'

import { SvgProps } from 'react-native-svg'
import { View } from '@avalabs/k2-mobile'

export interface PrimaryNetworkMethodIconProp {
  methodName:
    | PChainTransactionType
    | XChainTransactionType
    | 'CreateAssetTx'
    | 'OperationTx'
}

const METHOD_NAME_TO_ICON: Record<
  | PChainTransactionType
  | XChainTransactionType
  | 'CreateAssetTx'
  | 'OperationTx',
  React.FC<SvgProps>
> = {
  // Both
  ImportTx: ArrowDownLeft,
  ExportTx: ArrowUpRight,
  BaseTx: ArrowRight,
  // X-Chain
  CreateAssetTx: AirDrop,
  OperationTx: AirDrop,
  // P-Chain
  AddPermissionlessDelegatorTx: AddUser,
  AddValidatorTx: AddUser,
  AddSubnetValidatorTx: AddUser,
  TransferSubnetOwnershipTx: AddUser,
  AddDelegatorTx: AddUser,
  CreateSubnetTx: Share,
  CreateChainTx: Blockchain,
  TransformSubnetTx: Blockchain,
  AddPermissionlessValidatorTx: AddUser,
  RemoveSubnetValidatorTx: MinusCircle,
  RewardValidatorTx: AirDrop,
  AdvanceTimeTx: Clock,
  UNKNOWN: HelpCircle
}

export const PrimaryNetworkMethodIcon = ({
  methodName
}: PrimaryNetworkMethodIconProp): React.JSX.Element => {
  const Icon = useMemo(
    () =>
      methodName
        ? METHOD_NAME_TO_ICON[methodName] || METHOD_NAME_TO_ICON.UNKNOWN
        : METHOD_NAME_TO_ICON.UNKNOWN,
    [methodName]
  )

  return (
    <View
      sx={{
        backgroundColor: '$neutral800',
        paddingHorizontal: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Icon width={20} height={20} />
    </View>
  )
}
