import { NetworkVMType } from '@avalabs/chains-sdk'
import { BlockchainId } from '@avalabs/glacier-sdk'
import { hashBlockchainId } from 'utils/hashBlockchainId'

export function getBlockChainIdForXpChain(
  vmName: NetworkVMType,
  isTestnet?: boolean
): string {
  if (vmName === NetworkVMType.AVM) {
    return isTestnet
      ? hashBlockchainId({
          blockchainId:
            BlockchainId._2JVSBOINJ9C2J33VNTVZ_YT_VJNZD_N2NKIWW_KJCUM_HUWEB5DB_BRM,
          isTestnet
        })
      : hashBlockchainId({
          blockchainId:
            BlockchainId._2O_YMBNV4E_NHYQK2FJJ_V5N_VQLDBTM_NJZQ5S3QS3LO6FTN_C6FBY_M
        })
  }
  return hashBlockchainId({
    blockchainId: BlockchainId._11111111111111111111111111111111LPO_YY,
    isTestnet
  })
}
