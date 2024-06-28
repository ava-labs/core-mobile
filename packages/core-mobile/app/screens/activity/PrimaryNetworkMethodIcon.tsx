import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/glacier-sdk'
import { useMemo } from 'react'
import React from 'react'
import ArrowDownLeft from 'assets/icons/arrowDownLeft.svg'
import ArrowUpRight from 'assets/icons/arrowUpRight.svg'
import ArrowRight from 'assets/icons/arrowRight.svg'
import Airdrop from 'assets/icons/airdrop.svg'
import AddUser from 'assets/icons/addUser.svg'
import Share from 'assets/icons/share2.svg'
import Blockchain from 'assets/icons/blockchain.svg'
import MinusCircle from 'assets/icons/minusCircle.svg'
import Clock from 'assets/icons/clock.svg'
import HelpCircle from 'assets/icons/helpCircle.svg'
import ArrowUp from 'assets/icons/arrowUp.svg'
import ArrowDown from 'assets/icons/arrowDown.svg'
import { SvgProps } from 'react-native-svg'
import { View } from '@avalabs/k2-mobile'
import { TransactionType } from '@avalabs/vm-module-types'
import SwapV2 from 'assets/icons/swap_v2.svg'
import Notes from 'assets/icons/notes.svg'

type TransactionTypes =
  | TransactionType
  | PChainTransactionType
  | XChainTransactionType
  | 'CreateAssetTx'
  | 'OperationTx'
export interface PrimaryNetworkMethodIconProp {
  methodName: TransactionTypes
  isContractCall: boolean
  isSender: boolean
}

const Swap = (): React.JSX.Element => <SwapV2 stroke={'currentColor'} />

const METHOD_NAME_TO_ICON: Record<
  TransactionTypes,
  React.FC<SvgProps> | undefined
> = {
  Swap,
  Send: ArrowUpRight,
  Receive: ArrowDownLeft,
  Airdrop,
  // Both
  ImportTx: ArrowDownLeft,
  ExportTx: ArrowUpRight,
  BaseTx: ArrowRight,
  // X-Chain
  CreateAssetTx: Airdrop,
  OperationTx: Airdrop,
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
  RewardValidatorTx: Airdrop,
  AdvanceTimeTx: Clock,

  Bridge: undefined,
  NFTBuy: undefined,
  NFTReceive: undefined,
  NFTSend: undefined,
  Approve: undefined,
  Transfer: undefined,
  FillOrder: undefined,
  Unwrap: undefined,
  UNKNOWN: undefined
}

export const PrimaryNetworkMethodIcon = ({
  methodName,
  isContractCall,
  isSender
}: PrimaryNetworkMethodIconProp): React.JSX.Element => {
  const Icon = useMemo(() => {
    if (methodName && METHOD_NAME_TO_ICON[methodName]) {
      return METHOD_NAME_TO_ICON[methodName] ?? HelpCircle
    }
    if (methodName === TransactionType.TRANSFER) {
      return isSender ? ArrowUp : ArrowDown
    }
    if (isContractCall) return Notes
    return HelpCircle
  }, [methodName, isContractCall, isSender])

  return (
    <View
      testID="network_icon"
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
