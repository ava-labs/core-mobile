import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

const ChainStatus = z.enum(['OK', 'UNAVAILABLE'])
const VmName = z.enum(['EVM', 'BITCOIN', 'ETHEREUM'])
const UtilityAddresses = z
  .object({ multicall: z.string() })
  .partial()
  .passthrough()
const NetworkToken = z
  .object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    logoUri: z.string().optional(),
    description: z.string().optional()
  })
  .passthrough()
const ChainInfo = z
  .object({
    chainId: z.string(),
    status: ChainStatus,
    chainName: z.string(),
    description: z.string(),
    platformChainId: z.string().optional(),
    subnetId: z.string().optional(),
    vmId: z.string().optional(),
    vmName: VmName,
    explorerUrl: z.string().optional(),
    rpcUrl: z.string(),
    wsUrl: z.string().optional(),
    isTestnet: z.boolean(),
    utilityAddresses: UtilityAddresses.optional(),
    networkToken: NetworkToken,
    chainLogoUri: z.string().optional(),
    private: z.boolean().optional(),
    enabledFeatures: z
      .array(z.enum(['nftIndexing', 'webhooks', 'teleporter']))
      .optional()
  })
  .passthrough()
const ListAddressChainsResponse = z
  .object({
    indexedChains: z.array(ChainInfo),
    unindexedChains: z.array(z.string())
  })
  .partial()
  .passthrough()
const BadRequest = z
  .object({
    message: z.union([z.string(), z.array(z.string())]),
    statusCode: z.number(),
    error: z.string()
  })
  .passthrough()
const Unauthorized = z
  .object({
    message: z.union([z.string(), z.array(z.string())]),
    statusCode: z.number(),
    error: z.string()
  })
  .passthrough()
const Forbidden = z
  .object({
    message: z.union([z.string(), z.array(z.string())]),
    statusCode: z.number(),
    error: z.string()
  })
  .passthrough()
const NotFound = z
  .object({
    message: z.union([z.string(), z.array(z.string())]),
    statusCode: z.number(),
    error: z.string()
  })
  .passthrough()
const TooManyRequests = z
  .object({
    message: z.union([z.string(), z.array(z.string())]),
    statusCode: z.number(),
    error: z.string()
  })
  .passthrough()
const InternalServerError = z
  .object({
    message: z.union([z.string(), z.array(z.string())]),
    statusCode: z.number(),
    error: z.string()
  })
  .passthrough()
const BadGateway = z
  .object({
    message: z.union([z.string(), z.array(z.string())]),
    statusCode: z.number(),
    error: z.string()
  })
  .passthrough()
const ServiceUnavailable = z
  .object({
    message: z.union([z.string(), z.array(z.string())]),
    statusCode: z.number(),
    error: z.string()
  })
  .passthrough()
const RichAddress = z
  .object({
    name: z.string().optional(),
    symbol: z.string().optional(),
    decimals: z.number().optional(),
    logoUri: z.string().optional(),
    address: z.string()
  })
  .passthrough()
const TransactionMethodType = z.enum([
  'NATIVE_TRANSFER',
  'CONTRACT_CALL',
  'CONTRACT_CREATION'
])
const Method = z
  .object({
    callType: TransactionMethodType,
    methodHash: z.string(),
    methodName: z.string().optional()
  })
  .passthrough()
const NativeTransaction = z
  .object({
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    blockHash: z.string(),
    chainId: z.string(),
    blockIndex: z.number(),
    txHash: z.string(),
    txStatus: z.string(),
    txType: z.number(),
    gasLimit: z.string(),
    gasUsed: z.string(),
    gasPrice: z.string(),
    nonce: z.string(),
    from: RichAddress,
    to: RichAddress,
    method: Method.optional(),
    value: z.string()
  })
  .passthrough()
const ListNativeTransactionsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(NativeTransaction)
  })
  .passthrough()
const EvmBlock = z
  .object({
    chainId: z.string(),
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    blockHash: z.string(),
    txCount: z.number(),
    baseFee: z.string(),
    gasUsed: z.string(),
    gasLimit: z.string(),
    gasCost: z.string(),
    parentHash: z.string(),
    feesSpent: z.string(),
    cumulativeTransactions: z.string()
  })
  .passthrough()
const ListEvmBlocksResponse = z
  .object({ nextPageToken: z.string().optional(), blocks: z.array(EvmBlock) })
  .passthrough()
const NftTokenMetadataStatus = z.enum([
  'UNKNOWN',
  'MISSING_TOKEN',
  'INVALID_TOKEN_URI',
  'INVALID_TOKEN_URI_SCHEME',
  'UNREACHABLE_TOKEN_URI',
  'THROTTLED_TOKEN_URI',
  'METADATA_CONTENT_TOO_LARGE',
  'INVALID_METADATA',
  'INVALID_METADATA_JSON',
  'INDEXED',
  'UNINDEXED'
])
const Erc721TokenMetadata = z
  .object({
    indexStatus: NftTokenMetadataStatus,
    metadataLastUpdatedTimestamp: z.number().optional(),
    name: z.string().optional(),
    symbol: z.string().optional(),
    imageUri: z.string().optional(),
    description: z.string().optional(),
    animationUri: z.string().optional(),
    externalUrl: z.string().optional(),
    background: z.string().optional(),
    attributes: z.string().optional()
  })
  .passthrough()
const Erc721Token = z
  .object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    ercType: z.literal('ERC-721'),
    tokenId: z.string(),
    tokenUri: z.string(),
    metadata: Erc721TokenMetadata,
    ownerAddress: z.string().optional()
  })
  .passthrough()
const Erc1155TokenMetadata = z
  .object({
    indexStatus: NftTokenMetadataStatus,
    metadataLastUpdatedTimestamp: z.number().optional(),
    name: z.string().optional(),
    symbol: z.string().optional(),
    imageUri: z.string().optional(),
    description: z.string().optional(),
    animationUri: z.string().optional(),
    externalUrl: z.string().optional(),
    background: z.string().optional(),
    decimals: z.number().optional(),
    properties: z.string().optional()
  })
  .passthrough()
const Erc1155Token = z
  .object({
    address: z.string(),
    ercType: z.literal('ERC-1155'),
    tokenId: z.string(),
    tokenUri: z.string(),
    metadata: Erc1155TokenMetadata
  })
  .passthrough()
const ListNftTokens = z
  .object({
    nextPageToken: z.string().optional(),
    tokens: z.array(z.union([Erc721Token, Erc1155Token]))
  })
  .passthrough()
const OperationType = z.enum([
  'TRANSACTION_EXPORT_PRIMARY_NETWORK',
  'TRANSACTION_EXPORT_PRIMARY_NETWORK_STAKING',
  'TRANSACTION_EXPORT_PRIMARY_NETWORK_SIMPLE',
  'TRANSACTION_EXPORT_EVM'
])
const OperationStatus = z.enum([
  'RUNNING',
  'COMPLETED',
  'COMPLETED_WITH_WARNING',
  'FAILED'
])
const OperationStatusCode = z.enum([
  'ErrInvalidRequest',
  'ErrInternal',
  'WarnTruncatedExport'
])
const TransactionExportMetadata = z
  .object({
    code: OperationStatusCode,
    downloadUrl: z.string(),
    nextDate: z.string()
  })
  .partial()
  .passthrough()
const OperationStatusResponse = z
  .object({
    operationId: z.string(),
    operationType: OperationType,
    operationStatus: OperationStatus,
    message: z.string().optional(),
    metadata: TransactionExportMetadata,
    createdAtTimestamp: z.number(),
    updatedAtTimestamp: z.number()
  })
  .passthrough()
const EVMOperationType = z.literal('TRANSACTION_EXPORT_EVM')
const EvmNetworkOptions = z
  .object({
    addresses: z.array(z.string()),
    includeChains: z.array(z.string())
  })
  .passthrough()
const CreateEvmTransactionExportRequest = z
  .object({
    type: EVMOperationType,
    firstDate: z.string().optional(),
    lastDate: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    options: EvmNetworkOptions
  })
  .passthrough()
const PrimaryNetworkOperationType = z.enum([
  'TRANSACTION_EXPORT_PRIMARY_NETWORK',
  'TRANSACTION_EXPORT_PRIMARY_NETWORK_STAKING',
  'TRANSACTION_EXPORT_PRIMARY_NETWORK_SIMPLE'
])
const PrimaryNetworkOptions = z
  .object({
    addresses: z.array(z.string()).optional(),
    cChainEvmAddresses: z.array(z.string()).optional(),
    includeChains: z.array(
      z.enum([
        '11111111111111111111111111111111LpoYY',
        '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
        '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
        '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
        '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
        'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
        'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu',
        'p-chain',
        'x-chain',
        'c-chain'
      ])
    )
  })
  .passthrough()
const CreatePrimaryNetworkTransactionExportRequest = z
  .object({
    type: PrimaryNetworkOperationType,
    firstDate: z.string().optional(),
    lastDate: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    options: PrimaryNetworkOptions
  })
  .passthrough()
const postTransactionExportJob_Body = z.union([
  CreateEvmTransactionExportRequest,
  CreatePrimaryNetworkTransactionExportRequest
])
const PChainTransactionType = z.enum([
  'AddValidatorTx',
  'AddSubnetValidatorTx',
  'AddDelegatorTx',
  'CreateChainTx',
  'CreateSubnetTx',
  'ImportTx',
  'ExportTx',
  'AdvanceTimeTx',
  'RewardValidatorTx',
  'RemoveSubnetValidatorTx',
  'TransformSubnetTx',
  'AddPermissionlessValidatorTx',
  'AddPermissionlessDelegatorTx',
  'BaseTx',
  'TransferSubnetOwnershipTx',
  'ConvertSubnetToL1Tx',
  'RegisterL1ValidatorTx',
  'SetL1ValidatorWeightTx',
  'DisableL1ValidatorTx',
  'IncreaseL1ValidatorBalanceTx',
  'UNKNOWN'
])
const PrimaryNetworkAssetType = z.enum(['secp256k1', 'nft'])
const AssetAmount = z
  .object({
    assetId: z.string(),
    name: z.string(),
    symbol: z.string(),
    denomination: z.number(),
    type: PrimaryNetworkAssetType,
    amount: z.string()
  })
  .passthrough()
const RewardType = z.enum(['VALIDATOR', 'DELEGATOR', 'VALIDATOR_FEE'])
const UtxoType = z.enum(['STAKE', 'TRANSFER'])
const PChainUtxo = z
  .object({
    addresses: z.array(z.string()),
    asset: AssetAmount,
    consumedOnChainId: z.string(),
    consumingTxHash: z.string().optional(),
    createdOnChainId: z.string(),
    utxoId: z.string(),
    amount: z.string(),
    assetId: z.string(),
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    consumingBlockNumber: z.string().optional(),
    consumingBlockTimestamp: z.number().optional(),
    platformLocktime: z.number().optional(),
    outputIndex: z.number(),
    rewardType: RewardType.optional(),
    stakeableLocktime: z.number().optional(),
    staked: z.boolean().optional(),
    threshold: z.number().optional(),
    txHash: z.string(),
    utxoEndTimestamp: z.number().optional(),
    utxoStartTimestamp: z.number().optional(),
    utxoType: UtxoType
  })
  .passthrough()
const L1ValidatorManagerDetails = z
  .object({ blockchainId: z.string(), contractAddress: z.string() })
  .passthrough()
const L1ValidatorDetailsTransaction = z
  .object({
    validationId: z.string(),
    nodeId: z.string(),
    subnetId: z.string(),
    weight: z.number(),
    remainingBalance: z.number(),
    balanceChange: z.number().optional(),
    blsCredentials: z.object({}).partial().passthrough().optional()
  })
  .passthrough()
const SubnetOwnershipInfo = z
  .object({
    locktime: z.number(),
    threshold: z.number(),
    addresses: z.array(z.string())
  })
  .passthrough()
const BlsCredentials = z
  .object({ publicKey: z.string(), proofOfPossession: z.string() })
  .passthrough()
const PChainTransaction = z
  .object({
    txHash: z.string(),
    txType: PChainTransactionType,
    blockTimestamp: z.number(),
    blockNumber: z.string(),
    blockHash: z.string(),
    consumedUtxos: z.array(PChainUtxo),
    emittedUtxos: z.array(PChainUtxo),
    sourceChain: z.string().optional(),
    destinationChain: z.string().optional(),
    value: z.array(AssetAmount),
    amountBurned: z.array(AssetAmount),
    amountStaked: z.array(AssetAmount),
    amountL1ValidatorBalanceBurned: z.array(AssetAmount),
    startTimestamp: z.number().optional(),
    endTimestamp: z.number().optional(),
    delegationFeePercent: z.string().optional(),
    nodeId: z.string().optional(),
    subnetId: z.string().optional(),
    l1ValidatorManagerDetails: L1ValidatorManagerDetails.optional(),
    l1ValidatorDetails: z.array(L1ValidatorDetailsTransaction).optional(),
    estimatedReward: z.string().optional(),
    rewardTxHash: z.string().optional(),
    rewardAddresses: z.array(z.string()).optional(),
    memo: z.string().optional(),
    stakingTxHash: z.string().optional(),
    subnetOwnershipInfo: SubnetOwnershipInfo.optional(),
    blsCredentials: BlsCredentials.optional()
  })
  .passthrough()
const XChainTransactionType = z.enum([
  'BaseTx',
  'CreateAssetTx',
  'OperationTx',
  'ImportTx',
  'ExportTx',
  'UNKNOWN'
])
const UtxoCredential = z
  .object({ signature: z.string(), publicKey: z.string() })
  .partial()
  .passthrough()
const Utxo = z
  .object({
    addresses: z.array(z.string()),
    asset: AssetAmount,
    consumedOnChainId: z.string(),
    consumingTxHash: z.string().optional(),
    createdOnChainId: z.string(),
    utxoId: z.string(),
    consumingTxTimestamp: z.number().optional(),
    creationTxHash: z.string(),
    credentials: z.array(UtxoCredential).optional(),
    groupId: z.number().optional(),
    locktime: z.number(),
    outputIndex: z.string(),
    payload: z.string().optional(),
    threshold: z.number(),
    timestamp: z.number(),
    utxoType: z.string()
  })
  .passthrough()
const PrimaryNetworkAssetCap = z.enum(['fixed', 'variable'])
const XChainAssetDetails = z
  .object({
    assetId: z.string(),
    name: z.string(),
    symbol: z.string(),
    denomination: z.number(),
    type: PrimaryNetworkAssetType,
    createdAtTimestamp: z.number(),
    cap: PrimaryNetworkAssetCap
  })
  .passthrough()
const TransactionVertexDetail = z
  .object({ hash: z.string(), height: z.number(), timestamp: z.number() })
  .passthrough()
const XChainNonLinearTransaction = z
  .object({
    txHash: z.string(),
    chainFormat: z.enum(['non-linear', 'linear']),
    timestamp: z.number(),
    txType: XChainTransactionType,
    memo: z.string(),
    consumedUtxos: z.array(Utxo),
    emittedUtxos: z.array(Utxo),
    amountUnlocked: z.array(AssetAmount),
    amountCreated: z.array(AssetAmount),
    sourceChain: z.string().optional(),
    destinationChain: z.string().optional(),
    assetCreated: XChainAssetDetails.optional(),
    vertices: z.array(TransactionVertexDetail)
  })
  .passthrough()
const XChainLinearTransaction = z
  .object({
    txHash: z.string(),
    chainFormat: z.enum(['non-linear', 'linear']),
    timestamp: z.number(),
    txType: XChainTransactionType,
    memo: z.string(),
    consumedUtxos: z.array(Utxo),
    emittedUtxos: z.array(Utxo),
    amountUnlocked: z.array(AssetAmount),
    amountCreated: z.array(AssetAmount),
    sourceChain: z.string().optional(),
    destinationChain: z.string().optional(),
    assetCreated: XChainAssetDetails.optional(),
    blockHeight: z.number(),
    blockHash: z.string()
  })
  .passthrough()
const EVMInput = z
  .object({
    fromAddress: z.string(),
    asset: AssetAmount,
    credentials: z.array(UtxoCredential)
  })
  .passthrough()
const CChainExportTransaction = z
  .object({
    txHash: z.string(),
    blockHeight: z.number(),
    blockHash: z.string(),
    timestamp: z.number(),
    memo: z.string(),
    amountUnlocked: z.array(AssetAmount),
    amountCreated: z.array(AssetAmount),
    sourceChain: z.string(),
    destinationChain: z.string(),
    txType: z.literal('ExportTx'),
    evmInputs: z.array(EVMInput),
    emittedUtxos: z.array(Utxo)
  })
  .passthrough()
const EVMOutput = z
  .object({ toAddress: z.string(), asset: AssetAmount })
  .passthrough()
const CChainImportTransaction = z
  .object({
    txHash: z.string(),
    blockHeight: z.number(),
    blockHash: z.string(),
    timestamp: z.number(),
    memo: z.string(),
    amountUnlocked: z.array(AssetAmount),
    amountCreated: z.array(AssetAmount),
    sourceChain: z.string(),
    destinationChain: z.string(),
    txType: z.literal('ImportTx'),
    evmOutputs: z.array(EVMOutput),
    consumedUtxos: z.array(Utxo)
  })
  .passthrough()
const PrimaryNetworkTxType = z.enum([
  'AddValidatorTx',
  'AddSubnetValidatorTx',
  'AddDelegatorTx',
  'CreateChainTx',
  'CreateSubnetTx',
  'ImportTx',
  'ExportTx',
  'AdvanceTimeTx',
  'RewardValidatorTx',
  'RemoveSubnetValidatorTx',
  'TransformSubnetTx',
  'AddPermissionlessValidatorTx',
  'AddPermissionlessDelegatorTx',
  'BaseTx',
  'TransferSubnetOwnershipTx',
  'ConvertSubnetToL1Tx',
  'RegisterL1ValidatorTx',
  'SetL1ValidatorWeightTx',
  'DisableL1ValidatorTx',
  'IncreaseL1ValidatorBalanceTx',
  'UNKNOWN',
  'CreateAssetTx',
  'OperationTx'
])
const PrimaryNetworkChainName = z.enum(['p-chain', 'x-chain', 'c-chain'])
const Network = z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
const PrimaryNetworkChainInfo = z
  .object({ chainName: PrimaryNetworkChainName, network: Network })
  .passthrough()
const ListPChainTransactionsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(PChainTransaction),
    chainInfo: PrimaryNetworkChainInfo
  })
  .passthrough()
const ListXChainTransactionsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(
      z.union([XChainNonLinearTransaction, XChainLinearTransaction])
    ),
    chainInfo: PrimaryNetworkChainInfo
  })
  .passthrough()
const ListCChainAtomicTransactionsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(
      z.union([CChainExportTransaction, CChainImportTransaction])
    ),
    chainInfo: PrimaryNetworkChainInfo
  })
  .passthrough()
const PendingReward = z
  .object({
    addresses: z.array(z.string()),
    txHash: z.string(),
    amountStaked: z.string(),
    nodeId: z.string(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    rewardType: RewardType,
    progress: z.number(),
    estimatedReward: AssetAmount
  })
  .passthrough()
const ListPendingRewardsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    pendingRewards: z.array(PendingReward)
  })
  .passthrough()
const CurrencyCode = z.enum([
  'usd',
  'eur',
  'aud',
  'cad',
  'chf',
  'clp',
  'cny',
  'czk',
  'dkk',
  'gbp',
  'hkd',
  'huf',
  'jpy',
  'nzd'
])
const Money = z
  .object({ currencyCode: CurrencyCode, value: z.number() })
  .passthrough()
const AssetWithPriceInfo = z
  .object({
    assetId: z.string(),
    name: z.string(),
    symbol: z.string(),
    denomination: z.number(),
    type: PrimaryNetworkAssetType,
    amount: z.string(),
    historicalPrice: Money.optional()
  })
  .passthrough()
const HistoricalReward = z
  .object({
    addresses: z.array(z.string()),
    txHash: z.string(),
    amountStaked: z.string(),
    nodeId: z.string(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    rewardType: RewardType,
    utxoId: z.string(),
    outputIndex: z.number(),
    reward: AssetWithPriceInfo,
    rewardTxHash: z.string()
  })
  .passthrough()
const ListHistoricalRewardsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    historicalRewards: z.array(HistoricalReward)
  })
  .passthrough()
const ListPChainUtxosResponse = z
  .object({
    nextPageToken: z.string().optional(),
    utxos: z.array(PChainUtxo),
    chainInfo: PrimaryNetworkChainInfo
  })
  .passthrough()
const ListUtxosResponse = z
  .object({
    nextPageToken: z.string().optional(),
    utxos: z.array(Utxo),
    chainInfo: PrimaryNetworkChainInfo
  })
  .passthrough()
const AggregatedAssetAmount = z
  .object({
    assetId: z.string(),
    name: z.string(),
    symbol: z.string(),
    denomination: z.number(),
    type: PrimaryNetworkAssetType,
    amount: z.string(),
    utxoCount: z.number()
  })
  .passthrough()
const PChainSharedAsset = z
  .object({
    assetId: z.string(),
    name: z.string(),
    symbol: z.string(),
    denomination: z.number(),
    type: PrimaryNetworkAssetType,
    amount: z.string(),
    utxoCount: z.number(),
    sharedWithChainId: z.string(),
    status: z.string()
  })
  .passthrough()
const PChainBalance = z
  .object({
    unlockedUnstaked: z.array(AggregatedAssetAmount),
    unlockedStaked: z.array(AggregatedAssetAmount),
    lockedPlatform: z.array(AggregatedAssetAmount),
    lockedStakeable: z.array(AggregatedAssetAmount),
    lockedStaked: z.array(AggregatedAssetAmount),
    pendingStaked: z.array(AggregatedAssetAmount),
    atomicMemoryUnlocked: z.array(PChainSharedAsset),
    atomicMemoryLocked: z.array(PChainSharedAsset)
  })
  .passthrough()
const ListPChainBalancesResponse = z
  .object({ balances: PChainBalance, chainInfo: PrimaryNetworkChainInfo })
  .passthrough()
const XChainSharedAssetBalance = z
  .object({
    assetId: z.string(),
    name: z.string(),
    symbol: z.string(),
    denomination: z.number(),
    type: PrimaryNetworkAssetType,
    amount: z.string(),
    utxoCount: z.number(),
    sharedWithChainId: z.string()
  })
  .passthrough()
const XChainBalances = z
  .object({
    locked: z.array(AggregatedAssetAmount),
    unlocked: z.array(AggregatedAssetAmount),
    atomicMemoryUnlocked: z.array(XChainSharedAssetBalance),
    atomicMemoryLocked: z.array(XChainSharedAssetBalance)
  })
  .passthrough()
const ListXChainBalancesResponse = z
  .object({ balances: XChainBalances, chainInfo: PrimaryNetworkChainInfo })
  .passthrough()
const CChainSharedAssetBalance = z
  .object({
    assetId: z.string(),
    name: z.string(),
    symbol: z.string(),
    denomination: z.number(),
    type: PrimaryNetworkAssetType,
    amount: z.string(),
    utxoCount: z.number(),
    sharedWithChainId: z.string()
  })
  .passthrough()
const CChainAtomicBalances = z
  .object({
    atomicMemoryUnlocked: z.array(CChainSharedAssetBalance),
    atomicMemoryLocked: z.array(CChainSharedAssetBalance)
  })
  .passthrough()
const ListCChainAtomicBalancesResponse = z
  .object({
    balances: CChainAtomicBalances,
    chainInfo: PrimaryNetworkChainInfo
  })
  .passthrough()
const ProposerDetails = z
  .object({
    proposerId: z.string(),
    proposerParentId: z.string(),
    proposerNodeId: z.string(),
    proposerPChainHeight: z.number(),
    proposerTimestamp: z.number()
  })
  .partial()
  .passthrough()
const GetPrimaryNetworkBlockResponse = z
  .object({
    blockNumber: z.string(),
    blockHash: z.string(),
    parentHash: z.string(),
    blockTimestamp: z.number(),
    blockType: z.string(),
    txCount: z.number(),
    transactions: z.array(z.string()),
    blockSizeBytes: z.number(),
    l1ValidatorsAccruedFees: z.number().optional(),
    activeL1Validators: z.number().optional(),
    currentSupply: z.string().optional(),
    proposerDetails: ProposerDetails.optional()
  })
  .passthrough()
const PrimaryNetworkBlock = z
  .object({
    blockNumber: z.string(),
    blockHash: z.string(),
    parentHash: z.string(),
    blockTimestamp: z.number(),
    blockType: z.string(),
    txCount: z.number(),
    transactions: z.array(z.string()),
    blockSizeBytes: z.number(),
    l1ValidatorsAccruedFees: z.number().optional(),
    activeL1Validators: z.number().optional(),
    currentSupply: z.string().optional(),
    proposerDetails: ProposerDetails.optional()
  })
  .passthrough()
const ListPrimaryNetworkBlocksResponse = z
  .object({
    nextPageToken: z.string().optional(),
    blocks: z.array(PrimaryNetworkBlock),
    chainInfo: PrimaryNetworkChainInfo
  })
  .passthrough()
const XChainVertex = z
  .object({
    vertexHash: z.string(),
    parentHashes: z.array(z.string()),
    vertexHeight: z.number(),
    vertexIndex: z.number(),
    vertexTimestamp: z.number(),
    txCount: z.number(),
    transactions: z.array(z.string()),
    vertexSizeBytes: z.number()
  })
  .passthrough()
const ListXChainVerticesResponse = z
  .object({
    nextPageToken: z.string().optional(),
    vertices: z.array(XChainVertex),
    chainInfo: PrimaryNetworkChainInfo
  })
  .passthrough()
const BlockchainIds = z.enum([
  '11111111111111111111111111111111LpoYY',
  '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
  '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
  '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
  '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
  'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
  'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu'
])
const ChainAddressChainIdMap = z
  .object({ address: z.string(), blockchainIds: z.array(BlockchainIds) })
  .passthrough()
const ChainAddressChainIdMapListResponse = z
  .object({ addresses: z.array(ChainAddressChainIdMap) })
  .passthrough()
const StakingDistribution = z
  .object({
    version: z.string(),
    amountStaked: z.string(),
    validatorCount: z.number()
  })
  .passthrough()
const ValidatorsDetails = z
  .object({
    validatorCount: z.number(),
    totalAmountStaked: z.string(),
    estimatedAnnualStakingReward: z.string(),
    stakingDistributionByVersion: z.array(StakingDistribution),
    stakingRatio: z.string()
  })
  .passthrough()
const DelegatorsDetails = z
  .object({ delegatorCount: z.number(), totalAmountStaked: z.string() })
  .passthrough()
const GetNetworkDetailsResponse = z
  .object({
    validatorDetails: ValidatorsDetails,
    delegatorDetails: DelegatorsDetails
  })
  .passthrough()
const Blockchain = z
  .object({
    createBlockTimestamp: z.number(),
    createBlockNumber: z.string(),
    blockchainId: z.string(),
    vmId: z.string(),
    subnetId: z.string(),
    blockchainName: z.string()
  })
  .passthrough()
const ListBlockchainsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    blockchains: z.array(Blockchain)
  })
  .passthrough()
const BlockchainInfo = z.object({ blockchainId: z.string() }).passthrough()
const Subnet = z
  .object({
    createBlockTimestamp: z.number(),
    createBlockIndex: z.string(),
    subnetId: z.string(),
    ownerAddresses: z.array(z.string()),
    threshold: z.number(),
    locktime: z.number(),
    subnetOwnershipInfo: SubnetOwnershipInfo,
    isL1: z.boolean(),
    l1ConversionTransactionHash: z.string().optional(),
    l1ValidatorManagerDetails: L1ValidatorManagerDetails.optional(),
    blockchains: z.array(BlockchainInfo)
  })
  .passthrough()
const ListSubnetsResponse = z
  .object({ nextPageToken: z.string().optional(), subnets: z.array(Subnet) })
  .passthrough()
const Rewards = z
  .object({
    validationRewardAmount: z.string(),
    delegationRewardAmount: z.string(),
    rewardAddresses: z.array(z.string()).optional(),
    rewardTxHash: z.string().optional()
  })
  .passthrough()
const CompletedValidatorDetails = z
  .object({
    txHash: z.string(),
    nodeId: z.string(),
    subnetId: z.string(),
    amountStaked: z.string(),
    delegationFee: z.string().optional(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    blsCredentials: BlsCredentials.optional(),
    delegatorCount: z.number(),
    amountDelegated: z.string().optional(),
    rewards: Rewards,
    validationStatus: z.literal('completed')
  })
  .passthrough()
const ValidatorHealthDetails = z
  .object({
    reachabilityPercent: z.number(),
    benchedPChainRequestsPercent: z.number(),
    benchedXChainRequestsPercent: z.number(),
    benchedCChainRequestsPercent: z.number()
  })
  .passthrough()
const ActiveValidatorDetails = z
  .object({
    txHash: z.string(),
    nodeId: z.string(),
    subnetId: z.string(),
    amountStaked: z.string(),
    delegationFee: z.string().optional(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    blsCredentials: BlsCredentials.optional(),
    stakePercentage: z.number(),
    delegatorCount: z.number(),
    amountDelegated: z.string().optional(),
    uptimePerformance: z.number(),
    avalancheGoVersion: z.string().optional(),
    delegationCapacity: z.string().optional(),
    potentialRewards: Rewards,
    validationStatus: z.literal('active'),
    validatorHealth: ValidatorHealthDetails
  })
  .passthrough()
const PendingValidatorDetails = z
  .object({
    txHash: z.string(),
    nodeId: z.string(),
    subnetId: z.string(),
    amountStaked: z.string(),
    delegationFee: z.string().optional(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    blsCredentials: BlsCredentials.optional(),
    validationStatus: z.literal('pending')
  })
  .passthrough()
const RemovedValidatorDetails = z
  .object({
    txHash: z.string(),
    nodeId: z.string(),
    subnetId: z.string(),
    amountStaked: z.string(),
    delegationFee: z.string().optional(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    blsCredentials: BlsCredentials.optional(),
    removeTxHash: z.string(),
    removeTimestamp: z.number(),
    validationStatus: z.literal('removed')
  })
  .passthrough()
const ListValidatorDetailsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    validators: z.array(
      z.discriminatedUnion('validationStatus', [
        CompletedValidatorDetails,
        ActiveValidatorDetails,
        PendingValidatorDetails,
        RemovedValidatorDetails
      ])
    )
  })
  .passthrough()
const CompletedDelegatorDetails = z
  .object({
    txHash: z.string(),
    nodeId: z.string(),
    rewardAddresses: z.array(z.string()),
    amountDelegated: z.string(),
    delegationFee: z.string(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    grossReward: z.string(),
    netReward: z.string(),
    delegationStatus: z.literal('completed')
  })
  .passthrough()
const ActiveDelegatorDetails = z
  .object({
    txHash: z.string(),
    nodeId: z.string(),
    rewardAddresses: z.array(z.string()),
    amountDelegated: z.string(),
    delegationFee: z.string(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    estimatedGrossReward: z.string(),
    estimatedNetReward: z.string(),
    delegationStatus: z.literal('active')
  })
  .passthrough()
const PendingDelegatorDetails = z
  .object({
    txHash: z.string(),
    nodeId: z.string(),
    rewardAddresses: z.array(z.string()),
    amountDelegated: z.string(),
    delegationFee: z.string(),
    startTimestamp: z.number(),
    endTimestamp: z.number(),
    estimatedGrossReward: z.string(),
    estimatedNetReward: z.string(),
    delegationStatus: z.literal('pending')
  })
  .passthrough()
const ListDelegatorDetailsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    delegators: z.array(
      z.discriminatedUnion('delegationStatus', [
        CompletedDelegatorDetails,
        ActiveDelegatorDetails,
        PendingDelegatorDetails
      ])
    )
  })
  .passthrough()
const BalanceOwner = z
  .object({ addresses: z.array(z.string()), threshold: z.number() })
  .passthrough()
const L1ValidatorDetailsFull = z
  .object({
    validationId: z.string(),
    nodeId: z.string(),
    subnetId: z.string(),
    weight: z.number(),
    remainingBalance: z.number(),
    creationTimestamp: z.number(),
    blsCredentials: z.object({}).partial().passthrough(),
    remainingBalanceOwner: BalanceOwner,
    deactivationOwner: BalanceOwner
  })
  .passthrough()
const ListL1ValidatorsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    validators: z.array(L1ValidatorDetailsFull)
  })
  .passthrough()
const TeleporterReceipt = z
  .object({
    receivedMessageNonce: z.string(),
    relayerRewardAddress: z.string()
  })
  .passthrough()
const TeleporterRewardDetails = z
  .object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    logoUri: z.string().optional(),
    ercType: z.literal('ERC-20'),
    price: Money.optional(),
    value: z.string()
  })
  .passthrough()
const TeleporterSourceTransaction = z
  .object({ txHash: z.string(), timestamp: z.number(), gasSpent: z.string() })
  .passthrough()
const PendingTeleporterMessage = z
  .object({
    messageId: z.string(),
    teleporterContractAddress: z.string(),
    sourceBlockchainId: z.string(),
    destinationBlockchainId: z.string(),
    sourceEvmChainId: z.string(),
    destinationEvmChainId: z.string(),
    messageNonce: z.string(),
    from: z.string(),
    to: z.string(),
    data: z.string().optional(),
    messageExecuted: z.boolean(),
    receipts: z.array(TeleporterReceipt),
    receiptDelivered: z.boolean(),
    rewardDetails: TeleporterRewardDetails,
    sourceTransaction: TeleporterSourceTransaction,
    status: z.literal('pending')
  })
  .passthrough()
const TeleporterDestinationTransaction = z
  .object({
    txHash: z.string(),
    timestamp: z.number(),
    gasSpent: z.string(),
    rewardRedeemer: z.string(),
    delivererAddress: z.string()
  })
  .passthrough()
const DeliveredTeleporterMessage = z
  .object({
    messageId: z.string(),
    teleporterContractAddress: z.string(),
    sourceBlockchainId: z.string(),
    destinationBlockchainId: z.string(),
    sourceEvmChainId: z.string(),
    destinationEvmChainId: z.string(),
    messageNonce: z.string(),
    from: z.string(),
    to: z.string(),
    data: z.string().optional(),
    messageExecuted: z.boolean(),
    receipts: z.array(TeleporterReceipt),
    receiptDelivered: z.boolean(),
    rewardDetails: TeleporterRewardDetails,
    sourceTransaction: TeleporterSourceTransaction,
    destinationTransaction: TeleporterDestinationTransaction,
    status: z.literal('delivered')
  })
  .passthrough()
const DeliveredSourceNotIndexedTeleporterMessage = z
  .object({
    messageId: z.string(),
    teleporterContractAddress: z.string(),
    sourceBlockchainId: z.string(),
    destinationBlockchainId: z.string(),
    sourceEvmChainId: z.string(),
    destinationEvmChainId: z.string(),
    messageNonce: z.string(),
    from: z.string(),
    to: z.string(),
    data: z.string().optional(),
    messageExecuted: z.boolean(),
    receipts: z.array(TeleporterReceipt),
    receiptDelivered: z.boolean(),
    rewardDetails: TeleporterRewardDetails,
    destinationTransaction: TeleporterDestinationTransaction,
    status: z.literal('delivered_source_not_indexed')
  })
  .passthrough()
const ListTeleporterMessagesResponse = z
  .object({
    nextPageToken: z.string().optional(),
    messages: z.array(
      z.discriminatedUnion('status', [
        PendingTeleporterMessage,
        DeliveredTeleporterMessage
      ])
    )
  })
  .passthrough()
const UsageMetricsValueDTO = z
  .object({
    groupedBy: z.enum([
      'requestPath',
      'responseCode',
      'chainId',
      'apiKeyId',
      'requestType',
      'None'
    ]),
    groupValue: z.union([z.string(), z.number()]).optional(),
    totalRequests: z.number(),
    requestsPerSecond: z.number(),
    successRatePercent: z.number(),
    medianResponseTimeMsecs: z.number(),
    invalidRequests: z.number(),
    apiCreditsUsed: z.number(),
    apiCreditsWasted: z.number()
  })
  .passthrough()
const Metric = z
  .object({ timestamp: z.number(), values: z.array(UsageMetricsValueDTO) })
  .passthrough()
const UsageMetricsResponseDTO = z
  .object({
    aggregateDuration: z.string(),
    orgId: z.string(),
    metrics: z.array(Metric)
  })
  .passthrough()
const RequestType = z.enum(['data', 'rpc'])
const LogsFormatMetadata = z
  .object({ ipAddress: z.string(), host: z.string(), userAgent: z.string() })
  .passthrough()
const LogsFormat = z
  .object({
    orgId: z.string(),
    logId: z.string(),
    eventTimestamp: z.number(),
    apiKeyId: z.string(),
    apiKeyAlias: z.string(),
    hostRegion: z.string(),
    requestType: RequestType,
    requestPath: z.string(),
    apiCreditsConsumed: z.number(),
    requestDurationMsecs: z.number(),
    responseCode: z.number(),
    chainId: z.string().optional(),
    rpcMethod: z.string().optional(),
    metadata: LogsFormatMetadata
  })
  .passthrough()
const LogsResponseDTO = z
  .object({
    nextPageToken: z.string().optional(),
    orgId: z.string(),
    logs: z.array(LogsFormat)
  })
  .passthrough()
const RpcUsageMetricsValueAggregated = z
  .object({
    totalRequests: z.number(),
    apiCreditsUsed: z.number(),
    requestsPerSecond: z.number(),
    successRatePercent: z.number(),
    medianResponseTimeMsecs: z.number(),
    invalidRequests: z.number(),
    apiCreditsWasted: z.number(),
    groupedBy: z.enum(['rpcMethod', 'responseCode', 'rlBypassToken', 'None']),
    groupValue: z.union([z.string(), z.number()]).optional()
  })
  .passthrough()
const RpcMetrics = z
  .object({
    timestamp: z.number(),
    values: z.array(RpcUsageMetricsValueAggregated)
  })
  .passthrough()
const SubnetRpcUsageMetricsResponseDTO = z
  .object({
    aggregateDuration: z.string(),
    metrics: z.array(RpcMetrics),
    chainId: z.string()
  })
  .passthrough()
const EventType = z.literal('address_activity')
const AddressActivityMetadata = z
  .object({
    addresses: z.array(z.string()),
    eventSignatures: z.array(z.string()).optional()
  })
  .passthrough()
const CreateWebhookRequest = z
  .object({
    url: z.string(),
    chainId: z.string(),
    eventType: EventType,
    metadata: AddressActivityMetadata,
    name: z.string().optional(),
    description: z.string().optional(),
    includeInternalTxs: z.boolean().optional(),
    includeLogs: z.boolean().optional()
  })
  .passthrough()
const WebhookStatusType = z.enum(['active', 'inactive'])
const WebhookResponse = z
  .object({
    id: z.string(),
    eventType: EventType,
    metadata: AddressActivityMetadata,
    includeInternalTxs: z.boolean().optional(),
    includeLogs: z.boolean().optional(),
    url: z.string(),
    chainId: z.string(),
    status: WebhookStatusType,
    createdAt: z.number(),
    name: z.string(),
    description: z.string()
  })
  .passthrough()
const ListWebhooksResponse = z
  .object({
    nextPageToken: z.string().optional(),
    webhooks: z.array(WebhookResponse)
  })
  .passthrough()
const UpdateWebhookRequest = z
  .object({
    name: z.string(),
    description: z.string(),
    url: z.string(),
    status: WebhookStatusType,
    includeInternalTxs: z.boolean(),
    includeLogs: z.boolean()
  })
  .partial()
  .passthrough()
const SharedSecretsResponse = z.object({ secret: z.string() }).passthrough()
const AddressesChangeRequest = z
  .object({ addresses: z.array(z.string()) })
  .passthrough()
const ListWebhookAddressesResponse = z
  .object({
    nextPageToken: z.string().optional(),
    addresses: z.array(z.string()),
    totalAddresses: z.number()
  })
  .passthrough()
const SignatureAggregatorRequest = z
  .object({
    message: z.string(),
    justification: z.string().optional(),
    signingSubnetId: z.string().optional(),
    quorumPercentage: z.number().optional()
  })
  .passthrough()
const SignatureAggregationResponse = z
  .object({ signedMessage: z.string() })
  .passthrough()
const NativeTokenBalance = z
  .object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    logoUri: z.string().optional(),
    chainId: z.string(),
    price: Money.optional(),
    balance: z.string(),
    balanceValue: Money.optional()
  })
  .passthrough()
const GetNativeBalanceResponse = z
  .object({ nativeTokenBalance: NativeTokenBalance })
  .passthrough()
const Erc20TokenBalance = z
  .object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    logoUri: z.string().optional(),
    ercType: z.literal('ERC-20'),
    price: Money.optional(),
    chainId: z.string(),
    balance: z.string(),
    balanceValue: Money.optional(),
    tokenReputation: z.enum(['Malicious', 'Benign']).nullable()
  })
  .passthrough()
const ListErc20BalancesResponse = z
  .object({
    nextPageToken: z.string().optional(),
    nativeTokenBalance: NativeTokenBalance,
    erc20TokenBalances: z.array(Erc20TokenBalance)
  })
  .passthrough()
const Erc721TokenBalance = z
  .object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    ercType: z.literal('ERC-721'),
    tokenId: z.string(),
    tokenUri: z.string(),
    metadata: Erc721TokenMetadata,
    ownerAddress: z.string().optional(),
    chainId: z.string()
  })
  .passthrough()
const ListErc721BalancesResponse = z
  .object({
    nextPageToken: z.string().optional(),
    nativeTokenBalance: NativeTokenBalance,
    erc721TokenBalances: z.array(Erc721TokenBalance)
  })
  .passthrough()
const Erc1155TokenBalance = z
  .object({
    address: z.string(),
    ercType: z.literal('ERC-1155'),
    tokenId: z.string(),
    tokenUri: z.string(),
    metadata: Erc1155TokenMetadata,
    chainId: z.string(),
    balance: z.string()
  })
  .passthrough()
const ListErc1155BalancesResponse = z
  .object({
    nextPageToken: z.string().optional(),
    nativeTokenBalance: NativeTokenBalance,
    erc1155TokenBalances: z.array(Erc1155TokenBalance)
  })
  .passthrough()
const ListCollectibleBalancesResponse = z
  .object({
    nextPageToken: z.string().optional(),
    collectibleBalances: z.array(
      z.union([Erc721TokenBalance, Erc1155TokenBalance])
    )
  })
  .passthrough()
const GetEvmBlockResponse = z
  .object({
    chainId: z.string(),
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    blockHash: z.string(),
    txCount: z.number(),
    baseFee: z.string(),
    gasUsed: z.string(),
    gasLimit: z.string(),
    gasCost: z.string(),
    parentHash: z.string(),
    feesSpent: z.string(),
    cumulativeTransactions: z.string()
  })
  .passthrough()
const Erc20Token = z
  .object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    logoUri: z.string().optional(),
    ercType: z.literal('ERC-20'),
    price: Money.optional()
  })
  .passthrough()
const Erc20TransferDetails = z
  .object({
    from: RichAddress,
    to: RichAddress,
    logIndex: z.number(),
    value: z.string(),
    erc20Token: Erc20Token
  })
  .passthrough()
const Erc721TransferDetails = z
  .object({
    from: RichAddress,
    to: RichAddress,
    logIndex: z.number(),
    erc721Token: Erc721Token
  })
  .passthrough()
const Erc1155TransferDetails = z
  .object({
    from: RichAddress,
    to: RichAddress,
    logIndex: z.number(),
    value: z.string(),
    erc1155Token: Erc1155Token
  })
  .passthrough()
const InternalTransactionOpCall = z.enum([
  'UNKNOWN',
  'CALL',
  'CREATE',
  'CREATE2',
  'CALLCODE',
  'DELEGATECALL',
  'STATICCALL'
])
const InternalTransactionDetails = z
  .object({
    from: RichAddress,
    to: RichAddress,
    internalTxType: InternalTransactionOpCall,
    value: z.string(),
    isReverted: z.boolean(),
    gasUsed: z.string(),
    gasLimit: z.string()
  })
  .passthrough()
const NetworkTokenDetails = z
  .object({
    networkToken: NetworkToken,
    currentPrice: Money.optional(),
    historicalPrice: Money.optional()
  })
  .passthrough()
const FullNativeTransactionDetails = z
  .object({
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    blockHash: z.string(),
    chainId: z.string(),
    blockIndex: z.number(),
    txHash: z.string(),
    txStatus: z.string(),
    txType: z.number(),
    gasLimit: z.string(),
    gasUsed: z.string(),
    gasPrice: z.string(),
    nonce: z.string(),
    from: RichAddress,
    to: RichAddress,
    method: Method.optional(),
    value: z.string(),
    input: z.string(),
    baseFeePerGas: z.string(),
    maxFeePerGas: z.string().optional(),
    maxPriorityFeePerGas: z.string().optional()
  })
  .passthrough()
const TransactionDirectionType = z.enum([
  'SOURCE_TRANSACTION',
  'DESTINATION_TRANSACTION'
])
const TeleporterMessageInfo = z
  .object({
    teleporterMessageId: z.string(),
    direction: TransactionDirectionType,
    sourceChainId: z.object({}).partial().passthrough().optional(),
    destinationChainId: z.object({}).partial().passthrough().optional()
  })
  .passthrough()
const GetTransactionResponse = z
  .object({
    erc20Transfers: z.array(Erc20TransferDetails).optional(),
    erc721Transfers: z.array(Erc721TransferDetails).optional(),
    erc1155Transfers: z.array(Erc1155TransferDetails).optional(),
    internalTransactions: z.array(InternalTransactionDetails).optional(),
    networkTokenDetails: NetworkTokenDetails,
    nativeTransaction: FullNativeTransactionDetails,
    teleporterMessageInfo: TeleporterMessageInfo.optional()
  })
  .passthrough()
const ImageAsset = z
  .object({ assetId: z.string(), imageUri: z.string() })
  .partial()
  .passthrough()
const ResourceLinkType = z.enum([
  'Blog',
  'CoinGecko',
  'CoinMarketCap',
  'Discord',
  'Documentation',
  'Facebook',
  'Github',
  'Instagram',
  'LinkedIn',
  'Medium',
  'Reddit',
  'Support',
  'Telegram',
  'TikTok',
  'Twitter',
  'Website',
  'Whitepaper',
  'Youtube'
])
const ResourceLink = z
  .object({ type: ResourceLinkType, url: z.string() })
  .passthrough()
const ContractDeploymentDetails = z
  .object({
    txHash: z.string(),
    deployerAddress: z.string(),
    deployerContractAddress: z.string().optional()
  })
  .passthrough()
const Erc721Contract = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    officialSite: z.string().optional(),
    email: z.string().optional(),
    logoAsset: ImageAsset.optional(),
    bannerAsset: ImageAsset.optional(),
    color: z.string().optional(),
    resourceLinks: z.array(ResourceLink).optional(),
    tags: z.array(z.string()).optional(),
    address: z.string(),
    deploymentDetails: ContractDeploymentDetails,
    ercType: z.literal('ERC-721'),
    symbol: z.string().optional()
  })
  .passthrough()
const PricingProviders = z
  .object({ coingeckoCoinId: z.string() })
  .partial()
  .passthrough()
const Erc1155Contract = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    officialSite: z.string().optional(),
    email: z.string().optional(),
    logoAsset: ImageAsset.optional(),
    bannerAsset: ImageAsset.optional(),
    color: z.string().optional(),
    resourceLinks: z.array(ResourceLink).optional(),
    tags: z.array(z.string()).optional(),
    address: z.string(),
    deploymentDetails: ContractDeploymentDetails,
    ercType: z.literal('ERC-1155'),
    symbol: z.string().optional(),
    pricingProviders: PricingProviders.optional()
  })
  .passthrough()
const Erc20Contract = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    officialSite: z.string().optional(),
    email: z.string().optional(),
    logoAsset: ImageAsset.optional(),
    bannerAsset: ImageAsset.optional(),
    color: z.string().optional(),
    resourceLinks: z.array(ResourceLink).optional(),
    tags: z.array(z.string()).optional(),
    address: z.string(),
    deploymentDetails: ContractDeploymentDetails,
    ercType: z.literal('ERC-20'),
    symbol: z.string().optional(),
    decimals: z.number(),
    pricingProviders: PricingProviders.optional()
  })
  .passthrough()
const UnknownContract = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    officialSite: z.string().optional(),
    email: z.string().optional(),
    logoAsset: ImageAsset.optional(),
    bannerAsset: ImageAsset.optional(),
    color: z.string().optional(),
    resourceLinks: z.array(ResourceLink).optional(),
    tags: z.array(z.string()).optional(),
    address: z.string(),
    deploymentDetails: ContractDeploymentDetails,
    ercType: z.literal('UNKNOWN')
  })
  .passthrough()
const ListContractsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    contracts: z.array(
      z.discriminatedUnion('ercType', [
        Erc721Contract,
        Erc1155Contract,
        Erc20Contract,
        UnknownContract
      ])
    )
  })
  .passthrough()
const ContractSubmissionErc1155 = z
  .object({
    description: z.string().optional(),
    officialSite: z.string().optional(),
    email: z.string().optional(),
    logoAsset: ImageAsset.optional(),
    bannerAsset: ImageAsset.optional(),
    color: z.string().optional(),
    resourceLinks: z.array(ResourceLink).optional(),
    tags: z.array(z.string()).optional(),
    name: z.string(),
    ercType: z.literal('ERC-1155'),
    symbol: z.string(),
    pricingProviders: PricingProviders.optional()
  })
  .passthrough()
const ContractSubmissionErc20 = z
  .object({
    description: z.string().optional(),
    officialSite: z.string().optional(),
    email: z.string().optional(),
    logoAsset: ImageAsset.optional(),
    bannerAsset: ImageAsset.optional(),
    color: z.string().optional(),
    resourceLinks: z.array(ResourceLink).optional(),
    tags: z.array(z.string()).optional(),
    name: z.string(),
    ercType: z.literal('ERC-20'),
    symbol: z.string(),
    pricingProviders: PricingProviders.optional()
  })
  .passthrough()
const ContractSubmissionErc721 = z
  .object({
    description: z.string().optional(),
    officialSite: z.string().optional(),
    email: z.string().optional(),
    logoAsset: ImageAsset.optional(),
    bannerAsset: ImageAsset.optional(),
    color: z.string().optional(),
    resourceLinks: z.array(ResourceLink).optional(),
    tags: z.array(z.string()).optional(),
    name: z.string(),
    ercType: z.literal('ERC-721'),
    symbol: z.string()
  })
  .passthrough()
const ContractSubmissionUnknown = z
  .object({
    description: z.string().optional(),
    officialSite: z.string().optional(),
    email: z.string().optional(),
    logoAsset: ImageAsset.optional(),
    bannerAsset: ImageAsset.optional(),
    color: z.string().optional(),
    resourceLinks: z.array(ResourceLink).optional(),
    tags: z.array(z.string()).optional(),
    name: z.string(),
    ercType: z.literal('UNKNOWN')
  })
  .passthrough()
const ContractSubmissionBody = z
  .object({
    contract: z.discriminatedUnion('ercType', [
      ContractSubmissionErc1155,
      ContractSubmissionErc20,
      ContractSubmissionErc721,
      ContractSubmissionUnknown
    ])
  })
  .passthrough()
const UpdateContractResponse = z
  .object({
    contract: z.discriminatedUnion('ercType', [
      UnknownContract,
      Erc20Contract,
      Erc721Contract,
      Erc1155Contract
    ])
  })
  .passthrough()
const ListChainsResponse = z
  .object({ chains: z.array(ChainInfo) })
  .passthrough()
const GetChainResponse = z
  .object({
    chainId: z.string(),
    status: ChainStatus,
    chainName: z.string(),
    description: z.string(),
    platformChainId: z.string().optional(),
    subnetId: z.string().optional(),
    vmId: z.string().optional(),
    vmName: VmName,
    explorerUrl: z.string().optional(),
    rpcUrl: z.string(),
    wsUrl: z.string().optional(),
    isTestnet: z.boolean(),
    utilityAddresses: UtilityAddresses.optional(),
    networkToken: NetworkToken,
    chainLogoUri: z.string().optional(),
    private: z.boolean().optional(),
    enabledFeatures: z
      .array(z.enum(['nftIndexing', 'webhooks', 'teleporter']))
      .optional()
  })
  .passthrough()
const Erc20Transfer = z
  .object({
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    blockHash: z.string(),
    txHash: z.string(),
    from: RichAddress,
    to: RichAddress,
    logIndex: z.number(),
    value: z.string(),
    erc20Token: Erc20Token
  })
  .passthrough()
const Erc721Transfer = z
  .object({
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    blockHash: z.string(),
    txHash: z.string(),
    from: RichAddress,
    to: RichAddress,
    logIndex: z.number(),
    erc721Token: Erc721Token
  })
  .passthrough()
const Erc1155Transfer = z
  .object({
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    blockHash: z.string(),
    txHash: z.string(),
    from: RichAddress,
    to: RichAddress,
    logIndex: z.number(),
    value: z.string(),
    erc1155Token: Erc1155Token
  })
  .passthrough()
const ListTransfersResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transfers: z.array(
      z.union([Erc20Transfer, Erc721Transfer, Erc1155Transfer])
    )
  })
  .passthrough()
const TransactionDetails = z
  .object({
    nativeTransaction: NativeTransaction,
    erc20Transfers: z.array(Erc20TransferDetails).optional(),
    erc721Transfers: z.array(Erc721TransferDetails).optional(),
    erc1155Transfers: z.array(Erc1155TransferDetails).optional(),
    internalTransactions: z.array(InternalTransactionDetails).optional()
  })
  .passthrough()
const ListTransactionDetailsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(TransactionDetails)
  })
  .passthrough()
const ListErc20TransactionsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(Erc20Transfer)
  })
  .passthrough()
const ListErc721TransactionsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(Erc721Transfer)
  })
  .passthrough()
const ListErc1155TransactionsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(Erc1155Transfer)
  })
  .passthrough()
const InternalTransaction = z
  .object({
    blockNumber: z.string(),
    blockTimestamp: z.number(),
    blockHash: z.string(),
    txHash: z.string(),
    from: RichAddress,
    to: RichAddress,
    internalTxType: InternalTransactionOpCall,
    value: z.string(),
    isReverted: z.boolean(),
    gasUsed: z.string(),
    gasLimit: z.string()
  })
  .passthrough()
const ListInternalTransactionsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    transactions: z.array(InternalTransaction)
  })
  .passthrough()

export const schemas = {
  ChainStatus,
  VmName,
  UtilityAddresses,
  NetworkToken,
  ChainInfo,
  ListAddressChainsResponse,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  TooManyRequests,
  InternalServerError,
  BadGateway,
  ServiceUnavailable,
  RichAddress,
  TransactionMethodType,
  Method,
  NativeTransaction,
  ListNativeTransactionsResponse,
  EvmBlock,
  ListEvmBlocksResponse,
  NftTokenMetadataStatus,
  Erc721TokenMetadata,
  Erc721Token,
  Erc1155TokenMetadata,
  Erc1155Token,
  ListNftTokens,
  OperationType,
  OperationStatus,
  OperationStatusCode,
  TransactionExportMetadata,
  OperationStatusResponse,
  EVMOperationType,
  EvmNetworkOptions,
  CreateEvmTransactionExportRequest,
  PrimaryNetworkOperationType,
  PrimaryNetworkOptions,
  CreatePrimaryNetworkTransactionExportRequest,
  postTransactionExportJob_Body,
  PChainTransactionType,
  PrimaryNetworkAssetType,
  AssetAmount,
  RewardType,
  UtxoType,
  PChainUtxo,
  L1ValidatorManagerDetails,
  L1ValidatorDetailsTransaction,
  SubnetOwnershipInfo,
  BlsCredentials,
  PChainTransaction,
  XChainTransactionType,
  UtxoCredential,
  Utxo,
  PrimaryNetworkAssetCap,
  XChainAssetDetails,
  TransactionVertexDetail,
  XChainNonLinearTransaction,
  XChainLinearTransaction,
  EVMInput,
  CChainExportTransaction,
  EVMOutput,
  CChainImportTransaction,
  PrimaryNetworkTxType,
  PrimaryNetworkChainName,
  Network,
  PrimaryNetworkChainInfo,
  ListPChainTransactionsResponse,
  ListXChainTransactionsResponse,
  ListCChainAtomicTransactionsResponse,
  PendingReward,
  ListPendingRewardsResponse,
  CurrencyCode,
  Money,
  AssetWithPriceInfo,
  HistoricalReward,
  ListHistoricalRewardsResponse,
  ListPChainUtxosResponse,
  ListUtxosResponse,
  AggregatedAssetAmount,
  PChainSharedAsset,
  PChainBalance,
  ListPChainBalancesResponse,
  XChainSharedAssetBalance,
  XChainBalances,
  ListXChainBalancesResponse,
  CChainSharedAssetBalance,
  CChainAtomicBalances,
  ListCChainAtomicBalancesResponse,
  ProposerDetails,
  GetPrimaryNetworkBlockResponse,
  PrimaryNetworkBlock,
  ListPrimaryNetworkBlocksResponse,
  XChainVertex,
  ListXChainVerticesResponse,
  BlockchainIds,
  ChainAddressChainIdMap,
  ChainAddressChainIdMapListResponse,
  StakingDistribution,
  ValidatorsDetails,
  DelegatorsDetails,
  GetNetworkDetailsResponse,
  Blockchain,
  ListBlockchainsResponse,
  BlockchainInfo,
  Subnet,
  ListSubnetsResponse,
  Rewards,
  CompletedValidatorDetails,
  ValidatorHealthDetails,
  ActiveValidatorDetails,
  PendingValidatorDetails,
  RemovedValidatorDetails,
  ListValidatorDetailsResponse,
  CompletedDelegatorDetails,
  ActiveDelegatorDetails,
  PendingDelegatorDetails,
  ListDelegatorDetailsResponse,
  BalanceOwner,
  L1ValidatorDetailsFull,
  ListL1ValidatorsResponse,
  TeleporterReceipt,
  TeleporterRewardDetails,
  TeleporterSourceTransaction,
  PendingTeleporterMessage,
  TeleporterDestinationTransaction,
  DeliveredTeleporterMessage,
  DeliveredSourceNotIndexedTeleporterMessage,
  ListTeleporterMessagesResponse,
  UsageMetricsValueDTO,
  Metric,
  UsageMetricsResponseDTO,
  RequestType,
  LogsFormatMetadata,
  LogsFormat,
  LogsResponseDTO,
  RpcUsageMetricsValueAggregated,
  RpcMetrics,
  SubnetRpcUsageMetricsResponseDTO,
  EventType,
  AddressActivityMetadata,
  CreateWebhookRequest,
  WebhookStatusType,
  WebhookResponse,
  ListWebhooksResponse,
  UpdateWebhookRequest,
  SharedSecretsResponse,
  AddressesChangeRequest,
  ListWebhookAddressesResponse,
  SignatureAggregatorRequest,
  SignatureAggregationResponse,
  NativeTokenBalance,
  GetNativeBalanceResponse,
  Erc20TokenBalance,
  ListErc20BalancesResponse,
  Erc721TokenBalance,
  ListErc721BalancesResponse,
  Erc1155TokenBalance,
  ListErc1155BalancesResponse,
  ListCollectibleBalancesResponse,
  GetEvmBlockResponse,
  Erc20Token,
  Erc20TransferDetails,
  Erc721TransferDetails,
  Erc1155TransferDetails,
  InternalTransactionOpCall,
  InternalTransactionDetails,
  NetworkTokenDetails,
  FullNativeTransactionDetails,
  TransactionDirectionType,
  TeleporterMessageInfo,
  GetTransactionResponse,
  ImageAsset,
  ResourceLinkType,
  ResourceLink,
  ContractDeploymentDetails,
  Erc721Contract,
  PricingProviders,
  Erc1155Contract,
  Erc20Contract,
  UnknownContract,
  ListContractsResponse,
  ContractSubmissionErc1155,
  ContractSubmissionErc20,
  ContractSubmissionErc721,
  ContractSubmissionUnknown,
  ContractSubmissionBody,
  UpdateContractResponse,
  ListChainsResponse,
  GetChainResponse,
  Erc20Transfer,
  Erc721Transfer,
  Erc1155Transfer,
  ListTransfersResponse,
  TransactionDetails,
  ListTransactionDetailsResponse,
  ListErc20TransactionsResponse,
  ListErc721TransactionsResponse,
  ListErc1155TransactionsResponse,
  InternalTransaction,
  ListInternalTransactionsResponse
}

const endpoints = makeApi([
  {
    method: 'get',
    path: '/v1/address/:address/chains',
    alias: 'listAddressChains',
    description: `Lists the chains where the specified address has  participated in transactions or ERC token transfers,  either as a sender or receiver. The data is refreshed every 15  minutes.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListAddressChainsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/apiLogs',
    alias: 'getApiLogs',
    description: `Gets logs for requests made by client over a specified time interval for a specific organization.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'orgId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'chainId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'responseCode',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'requestType',
        type: 'Query',
        schema: z.enum(['data', 'rpc']).optional()
      },
      {
        name: 'apiKeyId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'requestPath',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      }
    ],
    response: LogsResponseDTO,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/apiUsageMetrics',
    alias: 'getApiUsageMetrics',
    description: `Gets metrics for Data API usage over a specified time interval aggregated at the specified time-duration granularity.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'orgId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'timeInterval',
        type: 'Query',
        schema: z
          .enum(['minute', 'hourly', 'daily', 'weekly', 'monthly'])
          .optional()
      },
      {
        name: 'groupBy',
        type: 'Query',
        schema: z
          .enum([
            'requestPath',
            'responseCode',
            'chainId',
            'apiKeyId',
            'requestType'
          ])
          .optional()
      },
      {
        name: 'chainId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'responseCode',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'requestType',
        type: 'Query',
        schema: z.enum(['data', 'rpc']).optional()
      },
      {
        name: 'apiKeyId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'requestPath',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: UsageMetricsResponseDTO,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/blocks',
    alias: 'listLatestBlocksAllChains',
    description: `Lists the most recent blocks from all supported  EVM-compatible chains. The results can be filtered by network.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'network',
        type: 'Query',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet']).optional()
      }
    ],
    response: ListEvmBlocksResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains',
    alias: 'supportedChains',
    description: `Lists the supported EVM-compatible chains. Filterable by network.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'network',
        type: 'Query',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet']).optional()
      },
      {
        name: 'feature',
        type: 'Query',
        schema: z.enum(['nftIndexing', 'webhooks', 'teleporter']).optional()
      }
    ],
    response: ListChainsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId',
    alias: 'getChainInfo',
    description: `Gets chain information for the EVM-compatible chain if supported by the api.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: GetChainResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address',
    alias: 'getContractMetadata',
    description: `Gets metadata about the contract at the given address.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.discriminatedUnion('ercType', [
      Erc721Contract,
      Erc1155Contract,
      Erc20Contract,
      UnknownContract
    ]),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/balances:getNative',
    alias: 'getNativeBalance',
    description: `Gets native token balance of a wallet address.

Balance at a given block can be retrieved with the &#x60;blockNumber&#x60; parameter.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'blockNumber',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'currency',
        type: 'Query',
        schema: z
          .enum([
            'usd',
            'eur',
            'aud',
            'cad',
            'chf',
            'clp',
            'cny',
            'czk',
            'dkk',
            'gbp',
            'hkd',
            'huf',
            'jpy',
            'nzd'
          ])
          .optional()
      }
    ],
    response: GetNativeBalanceResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/balances:listCollectibles',
    alias: 'listCollectibleBalances',
    description: `Lists ERC-721 and ERC-1155 token balances of a wallet address.

Balance for a specific contract can be retrieved with the &#x60;contractAddress&#x60; parameter.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'contractAddress',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: ListCollectibleBalancesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/balances:listErc1155',
    alias: 'listErc1155Balances',
    description: `Lists ERC-1155 token balances of a wallet address.

Balance at a given block can be retrieved with the &#x60;blockNumber&#x60; parameter.

Balance for a specific contract can be retrieved with the &#x60;contractAddress&#x60; parameter.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'blockNumber',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'contractAddress',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: ListErc1155BalancesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/balances:listErc20',
    alias: 'listErc20Balances',
    description: `Lists ERC-20 token balances of a wallet address.

Balance at a given block can be retrieved with the &#x60;blockNumber&#x60; parameter.

Balance for specific contracts can be retrieved with the &#x60;contractAddresses&#x60; parameter.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'blockNumber',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'filterSpamTokens',
        type: 'Query',
        schema: z.boolean().optional().default(true)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'contractAddresses',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'currency',
        type: 'Query',
        schema: z
          .enum([
            'usd',
            'eur',
            'aud',
            'cad',
            'chf',
            'clp',
            'cny',
            'czk',
            'dkk',
            'gbp',
            'hkd',
            'huf',
            'jpy',
            'nzd'
          ])
          .optional()
      }
    ],
    response: ListErc20BalancesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/balances:listErc721',
    alias: 'listErc721Balances',
    description: `Lists ERC-721 token balances of a wallet address.

Balance for a specific contract can be retrieved with the &#x60;contractAddress&#x60; parameter.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'contractAddress',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: ListErc721BalancesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/transactions',
    alias: 'listTransactions',
    description: `Returns a list of transactions where the given wallet address had an on-chain interaction for the given chain. The ERC-20 transfers, ERC-721 transfers, ERC-1155, and internal transactions returned are only those where the input address had an interaction. Specifically, those lists only inlcude entries where the input address was the sender (&#x60;from&#x60; field) or the receiver (&#x60;to&#x60; field) for the sub-transaction. Therefore the transactions returned from this list may not be complete representations of the on-chain data. For a complete view of a transaction use the &#x60;/chains/:chainId/transactions/:txHash&#x60; endpoint.

Filterable by block ranges.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'startBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'endBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: ListTransactionDetailsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/transactions:listErc1155',
    alias: 'listErc1155Transactions',
    description: `Lists ERC-1155 transfers for an address. Filterable by block range.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'startBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'endBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListErc1155TransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/transactions:listErc20',
    alias: 'listErc20Transactions',
    description: `Lists ERC-20 transfers for an address. Filterable by block range.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'startBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'endBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListErc20TransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/transactions:listErc721',
    alias: 'listErc721Transactions',
    description: `Lists ERC-721 transfers for an address. Filterable by block range.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'startBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'endBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListErc721TransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/transactions:listInternals',
    alias: 'listInternalTransactions',
    description: `Returns a list of internal transactions for an address and chain. Filterable by block range.

Note that the internal transactions list only contains &#x60;CALL&#x60; or &#x60;CALLCODE&#x60; transactions with a non-zero value and &#x60;CREATE&#x60;/&#x60;CREATE2&#x60; transactions. To get a complete list of internal transactions use the &#x60;debug_&#x60; prefixed RPC methods on an archive node.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'startBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'endBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListInternalTransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/addresses/:address/transactions:listNative',
    alias: 'listNativeTransactions',
    description: `Lists native transactions for an address. Filterable by block range.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'startBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'endBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListNativeTransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/blocks',
    alias: 'getLatestBlocks',
    description: `Lists the latest indexed blocks on the EVM-compatible chain sorted in descending order by block timestamp.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListEvmBlocksResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/blocks/:blockId',
    alias: 'getBlock',
    description: `Gets the details of an individual block on the EVM-compatible chain.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'blockId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: GetEvmBlockResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/blocks/:blockId/transactions',
    alias: 'getTransactionsForBlock',
    description: `Lists the transactions that occured in a given block.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(0).lte(100).optional().default(0)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'blockId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListNativeTransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'patch',
    path: '/v1/chains/:chainId/contracts/:address',
    alias: 'updateContractInfo',
    description: `Update contract information. Updates will be reviewed by the Ava Labs team before they are published.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ContractSubmissionBody
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: UpdateContractResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/contracts/:address/deployments',
    alias: 'listContractDeployments',
    description: `Lists all contracts deployed by the given address.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListContractsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/contracts/:address/transactions:getDeployment',
    alias: 'getDeploymentTransaction',
    description: `If the address is a smart contract, returns the transaction in which it was deployed.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'currency',
        type: 'Query',
        schema: z
          .enum([
            'usd',
            'eur',
            'aud',
            'cad',
            'chf',
            'clp',
            'cny',
            'czk',
            'dkk',
            'gbp',
            'hkd',
            'huf',
            'jpy',
            'nzd'
          ])
          .optional()
      }
    ],
    response: GetTransactionResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/nfts/collections/:address/tokens',
    alias: 'listTokens',
    description: `Lists tokens for an NFT contract.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListNftTokens,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/nfts/collections/:address/tokens/:tokenId',
    alias: 'getTokenDetails',
    description: `Gets token details for a specific token of an NFT contract.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'tokenId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.discriminatedUnion('ercType', [Erc721Token, Erc1155Token]),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'post',
    path: '/v1/chains/:chainId/nfts/collections/:address/tokens/:tokenId:reindex',
    alias: 'reindexNft',
    description: `Triggers reindexing of token metadata for an NFT token. Reindexing can only be called once per hour for each NFT token.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'tokenId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/tokens/:address/transfers',
    alias: 'listTransfers',
    description: `Lists ERC transfers for an ERC-20, ERC-721, or ERC-1155 contract address.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'startBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'endBlock',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListTransfersResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/transactions',
    alias: 'listLatestTransactions',
    description: `Lists the latest transactions. Filterable by status.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'status',
        type: 'Query',
        schema: z.enum(['failed', 'success']).optional()
      }
    ],
    response: ListNativeTransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/chains/:chainId/transactions/:txHash',
    alias: 'getTransaction',
    description: `Gets the details of a single transaction.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'chainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'txHash',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: GetTransactionResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/health-check',
    alias: 'data-health-check',
    requestFormat: 'json',
    response: z
      .object({
        status: z.string(),
        info: z.record(z.record(z.string())).nullable(),
        error: z.record(z.record(z.string())).nullable(),
        details: z.record(z.record(z.string()))
      })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 503,
        description: `The Health Check is not successful`,
        schema: z
          .object({
            status: z.string(),
            info: z.record(z.record(z.string())).nullable(),
            error: z.record(z.record(z.string())).nullable(),
            details: z.record(z.record(z.string()))
          })
          .partial()
          .passthrough()
      }
    ]
  },
  {
    method: 'post',
    path: '/v1/media/uploadImage',
    alias: 'MediaController_uploadImage',
    requestFormat: 'json',
    response: z.void()
  },
  {
    method: 'get',
    path: '/v1/networks/:network',
    alias: 'getNetworkDetails',
    description: `Gets network details such as validator and delegator stats.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      }
    ],
    response: GetNetworkDetailsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/addresses:listChainIds',
    alias: 'getChainIdsForAddresses',
    description: `Returns Primary Network chains that each address has touched in the form of an address mapped array. If an address has had any on-chain interaction for a chain, that chain&#x27;s chain id will be returned.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'addresses',
        type: 'Query',
        schema: z.string()
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      }
    ],
    response: ChainAddressChainIdMapListResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains',
    alias: 'listBlockchains',
    description: `Lists all blockchains registered on the network.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: ListBlockchainsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/assets/:assetId',
    alias: 'getAssetDetails',
    description: `Gets asset details corresponding to the given asset id on the X-Chain.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'assetId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: XChainAssetDetails,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/assets/:assetId/transactions',
    alias: 'listAssetTransactions',
    description: `Lists asset transactions corresponding to the given asset id on the X-Chain.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'txTypes',
        type: 'Query',
        schema: z.array(PrimaryNetworkTxType).optional()
      },
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'assetId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListXChainTransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/balances',
    alias: 'getBalancesByAddresses',
    description: `Gets primary network balances for one of the Primary Network chains for the supplied addresses.

C-Chain balances returned are only the shared atomic memory balance. For EVM balance, use the &#x60;/v1/chains/:chainId/addresses/:addressId/balances:getNative&#x60; endpoint.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'blockTimestamp',
        type: 'Query',
        schema: z.number().int().optional()
      },
      {
        name: 'addresses',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      }
    ],
    response: z.union([
      ListPChainBalancesResponse,
      ListXChainBalancesResponse,
      ListCChainAtomicBalancesResponse
    ]),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/blocks',
    alias: 'listLatestPrimaryNetworkBlocks',
    description: `Lists latest blocks on one of the Primary Network chains.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      }
    ],
    response: ListPrimaryNetworkBlocksResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/blocks/:blockId',
    alias: 'getBlockById',
    description: `Gets a block by block height or block hash on one of the Primary Network chains.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'blockId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: GetPrimaryNetworkBlockResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/nodes/:nodeId/blocks',
    alias: 'listPrimaryNetworkBlocksByNodeId',
    description: `Lists the latest blocks proposed by a given NodeID on one of the Primary Network chains.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'nodeId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListPrimaryNetworkBlocksResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/transactions',
    alias: 'listLatestPrimaryNetworkTransactions',
    description: `Lists the latest transactions on one of the Primary Network chains.

Transactions are filterable by addresses, txTypes, and timestamps. When querying for latest transactions without an address parameter, filtering by txTypes and timestamps is not supported. An address filter must be provided to utilize txTypes and timestamp filters.

For P-Chain, you can fetch all L1 validators related transactions like ConvertSubnetToL1Tx, IncreaseL1ValidatorBalanceTx etc. using the unique L1 validation ID. These transactions are further filterable by txTypes and timestamps as well.

Given that each transaction may return a large number of UTXO objects, bounded only by the maximum transaction size, the query may return less transactions than the provided page size. The result will contain less results than the page size if the number of utxos contained in the resulting transactions reach a performance threshold.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'addresses',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'l1ValidationId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'txTypes',
        type: 'Query',
        schema: z.array(PrimaryNetworkTxType).optional()
      },
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: z.union([
      ListPChainTransactionsResponse,
      ListXChainTransactionsResponse,
      ListCChainAtomicTransactionsResponse
    ]),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/transactions:listStaking',
    alias: 'listActivePrimaryNetworkStakingTransactions',
    description: `Lists active staking transactions on the P-Chain for the supplied addresses.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'addresses',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'txTypes',
        type: 'Query',
        schema: z.array(PrimaryNetworkTxType).optional()
      },
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum(['11111111111111111111111111111111LpoYY', 'p-chain'])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: ListPChainTransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/transactions/:txHash',
    alias: 'getTxByHash',
    description: `Gets the details of a single transaction on one of the Primary Network chains.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'txHash',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.union([
      PChainTransaction,
      XChainNonLinearTransaction,
      XChainLinearTransaction,
      CChainExportTransaction,
      CChainImportTransaction
    ]),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/utxos',
    alias: 'getUtxosByAddresses',
    description: `Lists UTXOs on one of the Primary Network chains for the supplied addresses.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'addresses',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'vV3cui1DsEPC3nLCGH9rorwo8s6BYxM2Hz4QFE5gEYjwTqAu',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'assetId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'includeSpent',
        type: 'Query',
        schema: z.boolean().optional()
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: z.union([ListPChainUtxosResponse, ListUtxosResponse]),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/vertices',
    alias: 'listLatestXChainVertices',
    description: `Lists latest vertices on the X-Chain.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      }
    ],
    response: ListXChainVerticesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/vertices:listByHeight',
    alias: 'getVertexByHeight',
    description: `Lists vertices at the given vertex height on the X-Chain.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'vertexHeight',
        type: 'Query',
        schema: z.number().int().gte(0)
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: ListXChainVerticesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/blockchains/:blockchainId/vertices/:vertexHash',
    alias: 'getVertexByHash',
    description: `Gets a single vertex on the X-Chain.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'vertexHash',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2piQ2AVHCjnduiWXsSY15DtbVuwHE2cwMHYnEXHsLL73BBkdbV',
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      }
    ],
    response: XChainVertex,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/delegators',
    alias: 'listDelegators',
    description: `Lists details for delegators.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'rewardAddresses',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      },
      {
        name: 'delegationStatus',
        type: 'Query',
        schema: z.enum(['completed', 'active', 'pending']).optional()
      },
      {
        name: 'nodeIds',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: ListDelegatorDetailsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/l1Validators',
    alias: 'listL1Validators',
    description: `Lists details for L1 validators. By default, returns details for all active L1 validators. Filterable by validator node ids, subnet id, and validation id.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'l1ValidationId',
        type: 'Query',
        schema: z.unknown().optional()
      },
      {
        name: 'includeInactiveL1Validators',
        type: 'Query',
        schema: z.boolean().optional()
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'nodeId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'subnetId',
        type: 'Query',
        schema: z.unknown().optional()
      }
    ],
    response: ListL1ValidatorsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/rewards',
    alias: 'listHistoricalPrimaryNetworkRewards',
    description: `Lists historical rewards on the Primary Network for the supplied addresses.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'addresses',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'nodeIds',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      },
      {
        name: 'currency',
        type: 'Query',
        schema: z
          .enum([
            'usd',
            'eur',
            'aud',
            'cad',
            'chf',
            'clp',
            'cny',
            'czk',
            'dkk',
            'gbp',
            'hkd',
            'huf',
            'jpy',
            'nzd'
          ])
          .optional()
      }
    ],
    response: ListHistoricalRewardsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/rewards:listPending',
    alias: 'listPendingPrimaryNetworkRewards',
    description: `Lists pending rewards on the Primary Network for the supplied addresses.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'addresses',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'nodeIds',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: ListPendingRewardsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/subnets',
    alias: 'listSubnets',
    description: `Lists all subnets registered on the network.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: ListSubnetsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/subnets/:subnetId',
    alias: 'getSubnetById',
    description: `Get details of the Subnet registered on the network.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'subnetId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: Subnet,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/validators',
    alias: 'listValidators',
    description: `Lists details for validators. By default, returns details for all validators. Filterable by validator node ids and minimum delegation capacity.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'nodeIds',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'sortBy',
        type: 'Query',
        schema: z
          .enum([
            'blockIndex',
            'delegationCapacity',
            'timeRemaining',
            'delegationFee',
            'uptimePerformance'
          ])
          .optional()
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      },
      {
        name: 'validationStatus',
        type: 'Query',
        schema: z.enum(['completed', 'active', 'pending', 'removed']).optional()
      },
      {
        name: 'minDelegationCapacity',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'maxDelegationCapacity',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'minTimeRemaining',
        type: 'Query',
        schema: z.number().gte(0).lte(2147483647).optional()
      },
      {
        name: 'maxTimeRemaining',
        type: 'Query',
        schema: z.number().gte(0).lte(2147483647).optional()
      },
      {
        name: 'minFeePercentage',
        type: 'Query',
        schema: z.number().gte(2).lte(100).optional()
      },
      {
        name: 'maxFeePercentage',
        type: 'Query',
        schema: z.number().gte(2).lte(100).optional()
      },
      {
        name: 'minUptimePerformance',
        type: 'Query',
        schema: z.number().gte(0).lte(100).optional()
      },
      {
        name: 'maxUptimePerformance',
        type: 'Query',
        schema: z.number().gte(0).lte(100).optional()
      },
      {
        name: 'subnetId',
        type: 'Query',
        schema: z.unknown().optional()
      }
    ],
    response: ListValidatorDetailsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/networks/:network/validators/:nodeId',
    alias: 'getSingleValidatorDetails',
    description: `List validator details for a single validator.  Filterable by validation status.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      },
      {
        name: 'nodeId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'validationStatus',
        type: 'Query',
        schema: z.enum(['completed', 'active', 'pending', 'removed']).optional()
      },
      {
        name: 'sortOrder',
        type: 'Query',
        schema: z.enum(['asc', 'desc']).optional()
      }
    ],
    response: ListValidatorDetailsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/operations/:operationId',
    alias: 'getOperationResult',
    description: `Gets operation details for the given operation id.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'operationId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: OperationStatusResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'post',
    path: '/v1/operations/transactions:export',
    alias: 'postTransactionExportJob',
    description: `Trigger a transaction export operation with given parameters.

The transaction export operation runs asynchronously in the background. The status of the job can be retrieved from the &#x60;/v1/operations/:operationId&#x60; endpoint using the &#x60;operationId&#x60; returned from this endpoint.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: postTransactionExportJob_Body
      }
    ],
    response: OperationStatusResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/primaryNetworkRpcUsageMetrics',
    alias: 'getPrimaryNetworkRpcUsageMetrics',
    description: `Gets metrics for public Primary Network RPC usage over  a specified time interval aggregated at the specified  time-duration granularity.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'timeInterval',
        type: 'Query',
        schema: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional()
      },
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'groupBy',
        type: 'Query',
        schema: z
          .enum([
            'requestPath',
            'responseCode',
            'country',
            'continent',
            'userAgent'
          ])
          .optional()
      },
      {
        name: 'responseCode',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'requestPath',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'country',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'continent',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'userAgent',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'network',
        type: 'Query',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      }
    ],
    response: SubnetRpcUsageMetricsResponseDTO,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/rpcUsageMetrics',
    alias: 'getRpcUsageMetrics',
    description: `Gets metrics for public Subnet RPC usage over a specified time interval aggregated at the specified time-duration granularity.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'timeInterval',
        type: 'Query',
        schema: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional()
      },
      {
        name: 'startTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'endTimestamp',
        type: 'Query',
        schema: z.number().int().gte(0).optional()
      },
      {
        name: 'groupBy',
        type: 'Query',
        schema: z
          .enum(['rpcMethod', 'responseCode', 'rlBypassToken'])
          .optional()
      },
      {
        name: 'chainId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'responseCode',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'rpcMethod',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'rlBypassApiToken',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: SubnetRpcUsageMetricsResponseDTO,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'post',
    path: '/v1/signatureAggregator/:network/aggregateSignatures',
    alias: 'aggregateSignatures',
    description: `Aggregates Signatures for a Warp message from Subnet validators.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SignatureAggregatorRequest
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet'])
      }
    ],
    response: z.object({ signedMessage: z.string() }).passthrough(),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/teleporter/addresses/:address/messages',
    alias: 'listTeleporterMessagesByAddress',
    description: `Lists teleporter messages by address. Ordered by timestamp in descending order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'address',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'network',
        type: 'Query',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet']).optional()
      }
    ],
    response: ListTeleporterMessagesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/teleporter/messages',
    alias: 'listTeleporterMessages',
    description: `Lists teleporter messages. Ordered by timestamp in descending order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'sourceBlockchainId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'destinationBlockchainId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'blockchainId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'to',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'from',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'network',
        type: 'Query',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet']).optional()
      }
    ],
    response: ListTeleporterMessagesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/teleporter/messages/:messageId',
    alias: 'getTeleporterMessage',
    description: `Gets a teleporter message by message ID.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'messageId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.discriminatedUnion('status', [
      PendingTeleporterMessage,
      DeliveredTeleporterMessage,
      DeliveredSourceNotIndexedTeleporterMessage
    ]),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/transactions',
    alias: 'listLatestTransactionsAllChains',
    description: `Lists the most recent transactions from all supported EVM-compatible  chains. The results can be filtered based on transaction status.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'network',
        type: 'Query',
        schema: z.enum(['mainnet', 'fuji', 'testnet', 'devnet']).optional()
      },
      {
        name: 'status',
        type: 'Query',
        schema: z.enum(['failed', 'success']).optional()
      }
    ],
    response: ListNativeTransactionsResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'post',
    path: '/v1/webhooks',
    alias: 'createWebhook',
    description: `Create a new webhook.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CreateWebhookRequest
      }
    ],
    response: WebhookResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/webhooks',
    alias: 'listWebhooks',
    description: `Lists webhooks for the user.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'status',
        type: 'Query',
        schema: z.enum(['active', 'inactive']).optional()
      }
    ],
    response: ListWebhooksResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'post',
    path: '/v1/webhooks:generateOrRotateSharedSecret',
    alias: 'generateSharedSecret',
    description: `Generates a new shared secret.`,
    requestFormat: 'json',
    response: z.object({ secret: z.string() }).passthrough(),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/webhooks:getSharedSecret',
    alias: 'getSharedSecret',
    description: `Get a previously generated shared secret.`,
    requestFormat: 'json',
    response: z.object({ secret: z.string() }).passthrough(),
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/webhooks/:id',
    alias: 'getWebhook',
    description: `Retrieves a webhook by ID.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: WebhookResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'delete',
    path: '/v1/webhooks/:id',
    alias: 'deactivateWebhook',
    description: `Deactivates a webhook by ID.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: WebhookResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'patch',
    path: '/v1/webhooks/:id',
    alias: 'updateWebhook',
    description: `Updates an existing webhook.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: UpdateWebhookRequest
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: WebhookResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'patch',
    path: '/v1/webhooks/:id/addresses',
    alias: 'addAddressesToWebhook',
    description: `Add addresses to webhook.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AddressesChangeRequest
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: WebhookResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'delete',
    path: '/v1/webhooks/:id/addresses',
    alias: 'removeAddressesFromWebhook',
    description: `Remove addresses from webhook.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AddressesChangeRequest
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: WebhookResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/webhooks/:id/addresses',
    alias: 'getAddressesFromWebhook',
    description: `List adresses by webhook.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(100).optional().default(10)
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ListWebhookAddressesResponse,
    errors: [
      {
        status: 400,
        description: `Bad requests generally mean the client has passed invalid 
    or malformed parameters. Error messages in the response could help in 
    evaluating the error.`,
        schema: BadRequest
      },
      {
        status: 401,
        description: `When a client attempts to access resources that require 
    authorization credentials but the client lacks proper authentication 
    in the request, the server responds with 401.`,
        schema: Unauthorized
      },
      {
        status: 403,
        description: `When a client attempts to access resources with valid
    credentials but doesn&#x27;t have the privilege to perform that action, 
    the server responds with 403.`,
        schema: Forbidden
      },
      {
        status: 404,
        description: `The error is mostly returned when the client requests
    with either mistyped URL, or the passed resource is moved or deleted, 
    or the resource doesn&#x27;t exist.`,
        schema: NotFound
      },
      {
        status: 429,
        description: `This error is returned when the client has sent too many,
    and has hit the rate limit.`,
        schema: TooManyRequests
      },
      {
        status: 500,
        description: `The error is a generic server side error that is 
    returned for any uncaught and unexpected issues on the server side. 
    This should be very rare, and you may reach out to us if the problem 
    persists for a longer duration.`,
        schema: InternalServerError
      },
      {
        status: 502,
        description: `This is an internal error indicating invalid response 
      received by the client-facing proxy or gateway from the upstream server.`,
        schema: BadGateway
      },
      {
        status: 503,
        description: `The error is returned for certain routes on a particular
    Subnet. This indicates an internal problem with our Subnet node, and may 
    not necessarily mean the Subnet is down or affected.`,
        schema: ServiceUnavailable
      }
    ]
  }
])

export const api = new Zodios(endpoints)

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
