import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

const HealthIndicatorResultDto = z
  .object({ status: z.enum(['up', 'down']) })
  .partial()
  .passthrough()
const HealthCheckResultDto = z
  .object({
    status: z.enum(['error', 'ok', 'shutting_down']),
    info: z.union([z.record(HealthIndicatorResultDto), z.null()]),
    error: z.union([z.record(HealthIndicatorResultDto), z.null()]),
    details: z.record(HealthIndicatorResultDto)
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
    blockTimestampMilliseconds: z.number().optional(),
    blockMinDelayExcess: z.number().optional(),
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
    blockTimestampMilliseconds: z.number().optional(),
    blockMinDelayExcess: z.number().optional(),
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
    metadata: TransactionExportMetadata.optional(),
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
        '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
        'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
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
    utxoBytes: z.string().optional(),
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
    validationIdHex: z.string(),
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
const EvmGenesisAllocDto = z
  .object({
    balance: z.string(),
    code: z.string(),
    storage: z.record(z.string())
  })
  .partial()
  .passthrough()
const EvmGenesisFeeConfigDto = z
  .object({
    baseFeeChangeDenominator: z.number(),
    blockGasCostStep: z.number(),
    gasLimit: z.number(),
    maxBlockGasCost: z.number(),
    minBaseFee: z.number(),
    minBlockGasCost: z.number(),
    targetBlockRate: z.number(),
    targetGas: z.number()
  })
  .partial()
  .passthrough()
const EvmGenesisWarpConfigDto = z
  .object({
    blockTimestamp: z.number(),
    quorumNumerator: z.number(),
    requirePrimaryNetworkSigners: z.boolean()
  })
  .partial()
  .passthrough()
const EvmGenesisAllowListConfigDto = z
  .object({
    blockTimestamp: z.number(),
    adminAddresses: z.array(z.string()),
    managerAddresses: z.array(z.string()),
    enabledAddresses: z.array(z.string())
  })
  .partial()
  .passthrough()
const EvmGenesisConfigDto = z
  .object({
    berlinBlock: z.number(),
    byzantiumBlock: z.number(),
    chainId: z.number(),
    constantinopleBlock: z.number(),
    eip150Block: z.number(),
    eip150Hash: z.string(),
    eip155Block: z.number(),
    eip158Block: z.number(),
    feeConfig: EvmGenesisFeeConfigDto,
    homesteadBlock: z.number(),
    istanbulBlock: z.number(),
    londonBlock: z.number(),
    muirGlacierBlock: z.number(),
    petersburgBlock: z.number(),
    subnetEVMTimestamp: z.number(),
    allowFeeRecipients: z.boolean(),
    warpConfig: EvmGenesisWarpConfigDto,
    txAllowListConfig: EvmGenesisAllowListConfigDto,
    contractDeployerAllowListConfig: EvmGenesisAllowListConfigDto,
    contractNativeMinterConfig: EvmGenesisAllowListConfigDto,
    feeManagerConfig: EvmGenesisAllowListConfigDto,
    rewardManagerConfig: EvmGenesisAllowListConfigDto
  })
  .partial()
  .passthrough()
const EvmGenesisDto = z
  .object({
    airdropAmount: z.union([z.number(), z.null()]),
    airdropHash: z.string(),
    alloc: z.record(EvmGenesisAllocDto),
    baseFeePerGas: z.union([z.number(), z.null()]),
    blobGasUsed: z.union([z.string(), z.null()]),
    coinbase: z.string(),
    config: EvmGenesisConfigDto,
    difficulty: z.string(),
    excessBlobGas: z.union([z.string(), z.null()]),
    extraData: z.string(),
    gasLimit: z.string(),
    gasUsed: z.string(),
    mixHash: z.string(),
    nonce: z.string(),
    number: z.string(),
    parentHash: z.string(),
    timestamp: z.string()
  })
  .partial()
  .passthrough()
const BlockchainInfo = z
  .object({
    chainName: z.string(),
    vmId: z.string(),
    genesisData: z.union([EvmGenesisDto, z.string()]).optional()
  })
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
    blsCredentials: BlsCredentials.optional(),
    blockchainInfo: BlockchainInfo.optional()
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
    utxoBytes: z.string().optional(),
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
const Network = z.enum(['mainnet', 'fuji', 'testnet'])
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
const PrimaryNetworkAddressesBodyDto = z
  .object({ addresses: z.string() })
  .passthrough()
const PrimaryNetworkType = z.enum(['mainnet', 'fuji'])
const LastActivityTimestamp = z
  .object({
    timestamp: z.number(),
    blockNumber: z.string(),
    txHash: z.string(),
    utxoId: z.string(),
    isConsumed: z.boolean(),
    chainName: PrimaryNetworkChainName,
    network: PrimaryNetworkType
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
  '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
  'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp'
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
    blockchainName: z.string(),
    evmChainId: z.number().optional(),
    genesisData: z.union([EvmGenesisDto, z.string()]).optional()
  })
  .passthrough()
const ListBlockchainsResponse = z
  .object({
    nextPageToken: z.string().optional(),
    blockchains: z.array(Blockchain)
  })
  .passthrough()
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
    blockchains: z.array(Blockchain)
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
const Geolocation = z
  .object({
    city: z.string(),
    country: z.string(),
    countryCode: z.string(),
    latitude: z.number(),
    longitude: z.number()
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
    validatorHealth: ValidatorHealthDetails,
    geolocation: Geolocation.nullable()
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
    validationIdHex: z.string(),
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
    validators: z.array(L1ValidatorDetailsFull),
    blockHeight: z.string()
  })
  .passthrough()
const IcmReceipt = z
  .object({
    receivedMessageNonce: z.string(),
    relayerRewardAddress: z.string()
  })
  .passthrough()
const IcmRewardDetails = z
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
const IcmSourceTransaction = z
  .object({ txHash: z.string(), timestamp: z.number(), gasSpent: z.string() })
  .passthrough()
const PendingIcmMessage = z
  .object({
    messageId: z.string(),
    icmContractAddress: z.string(),
    sourceBlockchainId: z.string(),
    destinationBlockchainId: z.string(),
    sourceEvmChainId: z.string(),
    destinationEvmChainId: z.string(),
    messageNonce: z.string(),
    from: z.string(),
    to: z.string(),
    data: z.string().optional(),
    messageExecuted: z.boolean(),
    receipts: z.array(IcmReceipt),
    receiptDelivered: z.boolean(),
    rewardDetails: IcmRewardDetails,
    sourceTransaction: IcmSourceTransaction,
    status: z.literal('pending')
  })
  .passthrough()
const IcmDestinationTransaction = z
  .object({
    txHash: z.string(),
    timestamp: z.number(),
    gasSpent: z.string(),
    rewardRedeemer: z.string(),
    delivererAddress: z.string()
  })
  .passthrough()
const DeliveredIcmMessage = z
  .object({
    messageId: z.string(),
    icmContractAddress: z.string(),
    sourceBlockchainId: z.string(),
    destinationBlockchainId: z.string(),
    sourceEvmChainId: z.string(),
    destinationEvmChainId: z.string(),
    messageNonce: z.string(),
    from: z.string(),
    to: z.string(),
    data: z.string().optional(),
    messageExecuted: z.boolean(),
    receipts: z.array(IcmReceipt),
    receiptDelivered: z.boolean(),
    rewardDetails: IcmRewardDetails,
    sourceTransaction: IcmSourceTransaction,
    destinationTransaction: IcmDestinationTransaction,
    status: z.literal('delivered')
  })
  .passthrough()
const DeliveredSourceNotIndexedIcmMessage = z
  .object({
    messageId: z.string(),
    icmContractAddress: z.string(),
    sourceBlockchainId: z.string(),
    destinationBlockchainId: z.string(),
    sourceEvmChainId: z.string(),
    destinationEvmChainId: z.string(),
    messageNonce: z.string(),
    from: z.string(),
    to: z.string(),
    data: z.string().optional(),
    messageExecuted: z.boolean(),
    receipts: z.array(IcmReceipt),
    receiptDelivered: z.boolean(),
    rewardDetails: IcmRewardDetails,
    destinationTransaction: IcmDestinationTransaction,
    status: z.literal('delivered_source_not_indexed')
  })
  .passthrough()
const ListIcmMessagesResponse = z
  .object({
    nextPageToken: z.string().optional(),
    messages: z.array(
      z.discriminatedUnion('status', [
        PendingIcmMessage,
        DeliveredIcmMessage,
        DeliveredSourceNotIndexedIcmMessage
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
    groupedBy: z.enum([
      'rpcMethod',
      'responseCode',
      'rlBypassToken',
      'requestPath',
      'country',
      'continent',
      'userAgent',
      'None'
    ]),
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
const PrimaryNetworkRpcUsageMetricsResponseDTO = z
  .object({
    aggregateDuration: z.string(),
    metrics: z.array(RpcMetrics),
    network: z.enum(['mainnet', 'testnet'])
  })
  .passthrough()
const AddressActivityMetadata = z
  .object({
    eventSignatures: z.array(z.string()).optional(),
    addresses: z.array(z.string())
  })
  .passthrough()
const EVMAddressActivityRequest = z
  .object({
    eventType: z.literal('address_activity'),
    url: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    chainId: z.string(),
    metadata: AddressActivityMetadata,
    includeInternalTxs: z.boolean().optional(),
    includeLogs: z.boolean().optional()
  })
  .passthrough()
const PlatformAddressActivityKeyType = z.literal('addresses')
const PrimaryNetworkAddressActivitySubEventType = z.enum([
  'balance_change',
  'balance_threshold',
  'reward_distribution'
])
const PrimaryNetworkAddressActivitySubEvents = z
  .object({
    addressActivitySubEvents: z.array(PrimaryNetworkAddressActivitySubEventType)
  })
  .passthrough()
const CommonBalanceType = z.enum([
  'unlockedUnstaked',
  'unlockedStaked',
  'lockedPlatform',
  'lockedStakeable',
  'lockedStaked',
  'pendingStaked',
  'unlocked',
  'locked',
  'atomicMemoryUnlocked',
  'atomicMemoryLocked'
])
const PrimaryNetworkBalanceThresholdFilter = z
  .object({ balanceType: CommonBalanceType, balanceThreshold: z.string() })
  .passthrough()
const PrimaryNetworkAddressActivityMetadata = z
  .object({
    eventSignatures: z.array(z.string()).optional(),
    keyType: PlatformAddressActivityKeyType,
    keys: z.array(z.string()),
    subEvents: PrimaryNetworkAddressActivitySubEvents,
    balanceThresholdFilter: PrimaryNetworkBalanceThresholdFilter.optional()
  })
  .passthrough()
const PrimaryNetworkAddressActivityRequest = z
  .object({
    eventType: z.literal('primary_network_address_activity'),
    url: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    network: PrimaryNetworkType,
    chainId: z.string(),
    metadata: PrimaryNetworkAddressActivityMetadata
  })
  .passthrough()
const ValidatorActivityKeyType = z.enum(['nodeId', 'subnetId'])
const ValidatorActivitySubEvents = z
  .object({
    validatorActivitySubEvents: z.array(
      z.enum([
        'validator_stake',
        'delegator_stake',
        'reward_distribution',
        'l1_validator_balance_increased',
        'l1_validator_disabled',
        'l1_validator_removed',
        'l1_validator_balance_threshold'
      ])
    )
  })
  .passthrough()
const ValidatorActivityMetadata = z
  .object({
    eventSignatures: z.array(z.string()).optional(),
    keyType: ValidatorActivityKeyType,
    keys: z.array(z.string()),
    subEvents: ValidatorActivitySubEvents,
    nodeIds: z.array(z.string()).optional(),
    subnetIds: z.array(z.string()).optional(),
    l1ValidatorFeeBalanceThreshold: z.string().optional()
  })
  .passthrough()
const ValidatorActivityRequest = z
  .object({
    eventType: z.literal('validator_activity'),
    url: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    network: PrimaryNetworkType,
    metadata: ValidatorActivityMetadata
  })
  .passthrough()
const createWebhook_Body = z.union([
  EVMAddressActivityRequest,
  PrimaryNetworkAddressActivityRequest,
  ValidatorActivityRequest
])
const WebhookStatusType = z.enum(['active', 'inactive'])
const AddressActivityEventType = z.literal('address_activity')
const EVMAddressActivityResponse = z
  .object({
    id: z.string(),
    url: z.string(),
    chainId: z.string(),
    status: WebhookStatusType,
    createdAt: z.number(),
    name: z.string(),
    description: z.string(),
    eventType: AddressActivityEventType,
    metadata: AddressActivityMetadata,
    includeInternalTxs: z.boolean().optional(),
    includeLogs: z.boolean().optional()
  })
  .passthrough()
const PrimaryNetworkAddressActivityEventType = z.literal(
  'primary_network_address_activity'
)
const PrimaryNetworkAddressActivityResponse = z
  .object({
    id: z.string(),
    url: z.string(),
    chainId: z.string(),
    status: WebhookStatusType,
    createdAt: z.number(),
    name: z.string(),
    description: z.string(),
    eventType: PrimaryNetworkAddressActivityEventType,
    metadata: PrimaryNetworkAddressActivityMetadata
  })
  .passthrough()
const ValidatorActivityEventType = z.literal('validator_activity')
const ValidatorActivityResponse = z
  .object({
    id: z.string(),
    url: z.string(),
    chainId: z.string(),
    status: WebhookStatusType,
    createdAt: z.number(),
    name: z.string(),
    description: z.string(),
    eventType: ValidatorActivityEventType,
    metadata: ValidatorActivityMetadata
  })
  .passthrough()
const ListWebhooksResponse = z
  .object({
    nextPageToken: z.string().optional(),
    webhooks: z.array(
      z.union([
        EVMAddressActivityResponse,
        PrimaryNetworkAddressActivityResponse,
        ValidatorActivityResponse
      ])
    )
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
const AvaxSupplyResponse = z
  .object({
    circulatingSupply: z.string(),
    totalSupply: z.string(),
    totalPBurned: z.string(),
    totalCBurned: z.string(),
    totalXBurned: z.string(),
    totalStaked: z.string(),
    totalLocked: z.string(),
    totalRewards: z.string(),
    lastUpdated: z.string().datetime({ offset: true }),
    genesisUnlock: z.string(),
    l1ValidatorFees: z.string()
  })
  .passthrough()
const SignatureAggregatorRequest = z
  .object({
    message: z.string(),
    justification: z.string(),
    signingSubnetId: z.string(),
    quorumPercentage: z.number(),
    quorumPercentageBuffer: z.number(),
    pChainHeight: z.number()
  })
  .partial()
  .passthrough()
const SignatureAggregationResponse = z
  .object({ signedMessage: z.string() })
  .passthrough()
const AccessRequest = z
  .object({ email: z.string(), captcha: z.string() })
  .passthrough()
const NotificationsResponse = z.object({ message: z.string() }).passthrough()
const SubscribeRequest = z
  .object({
    accessToken: z.string(),
    nodeId: z.string(),
    notifications: z
      .array(z.enum(['connectivity', 'ports', 'version']))
      .optional()
  })
  .passthrough()
const UnsubscribeRequest = z
  .object({ accessToken: z.string(), nodeId: z.string() })
  .passthrough()
const SubscriptionsRequest = z.object({ accessToken: z.string() }).passthrough()
const SubscriptionsResponse = z
  .object({
    email: z.string(),
    subscriptions: z.record(
      z
        .object({
          notifications: z.array(z.enum(['connectivity', 'ports', 'version']))
        })
        .partial()
        .passthrough()
    )
  })
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
    tokenReputation: z.union([z.enum(['Malicious', 'Benign']), z.null()])
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
    blockTimestampMilliseconds: z.number().optional(),
    blockMinDelayExcess: z.number().optional(),
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
  'CREATE3',
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
    blockTimestampMilliseconds: z.number().optional(),
    blockMinDelayExcess: z.number().optional(),
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
    sourceChainId: z.string().optional(),
    destinationChainId: z.string().optional()
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
    deploymentDetails: ContractDeploymentDetails.optional(),
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
    deploymentDetails: ContractDeploymentDetails.optional(),
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
    deploymentDetails: ContractDeploymentDetails.optional(),
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
    deploymentDetails: ContractDeploymentDetails.optional(),
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
    blockTimestampMilliseconds: z.number().optional(),
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
    blockTimestampMilliseconds: z.number().optional(),
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
    blockTimestampMilliseconds: z.number().optional(),
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
    blockTimestampMilliseconds: z.number().optional(),
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
  HealthIndicatorResultDto,
  HealthCheckResultDto,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  TooManyRequests,
  InternalServerError,
  BadGateway,
  ServiceUnavailable,
  ChainStatus,
  VmName,
  UtilityAddresses,
  NetworkToken,
  ChainInfo,
  ListAddressChainsResponse,
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
  EvmGenesisAllocDto,
  EvmGenesisFeeConfigDto,
  EvmGenesisWarpConfigDto,
  EvmGenesisAllowListConfigDto,
  EvmGenesisConfigDto,
  EvmGenesisDto,
  BlockchainInfo,
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
  PrimaryNetworkAddressesBodyDto,
  PrimaryNetworkType,
  LastActivityTimestamp,
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
  Subnet,
  ListSubnetsResponse,
  Rewards,
  CompletedValidatorDetails,
  ValidatorHealthDetails,
  Geolocation,
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
  IcmReceipt,
  IcmRewardDetails,
  IcmSourceTransaction,
  PendingIcmMessage,
  IcmDestinationTransaction,
  DeliveredIcmMessage,
  DeliveredSourceNotIndexedIcmMessage,
  ListIcmMessagesResponse,
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
  PrimaryNetworkRpcUsageMetricsResponseDTO,
  AddressActivityMetadata,
  EVMAddressActivityRequest,
  PlatformAddressActivityKeyType,
  PrimaryNetworkAddressActivitySubEventType,
  PrimaryNetworkAddressActivitySubEvents,
  CommonBalanceType,
  PrimaryNetworkBalanceThresholdFilter,
  PrimaryNetworkAddressActivityMetadata,
  PrimaryNetworkAddressActivityRequest,
  ValidatorActivityKeyType,
  ValidatorActivitySubEvents,
  ValidatorActivityMetadata,
  ValidatorActivityRequest,
  createWebhook_Body,
  WebhookStatusType,
  AddressActivityEventType,
  EVMAddressActivityResponse,
  PrimaryNetworkAddressActivityEventType,
  PrimaryNetworkAddressActivityResponse,
  ValidatorActivityEventType,
  ValidatorActivityResponse,
  ListWebhooksResponse,
  UpdateWebhookRequest,
  SharedSecretsResponse,
  AddressesChangeRequest,
  ListWebhookAddressesResponse,
  AvaxSupplyResponse,
  SignatureAggregatorRequest,
  SignatureAggregationResponse,
  AccessRequest,
  NotificationsResponse,
  SubscribeRequest,
  UnsubscribeRequest,
  SubscriptionsRequest,
  SubscriptionsResponse,
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
    description: `Lists the chains where the specified address has participated in transactions or ERC token transfers, either as a sender or receiver. The data is refreshed every 15 minutes.`,
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
    path: '/v1/avax/supply',
    alias: 'getAvaxSupply',
    description: `Get AVAX supply information that includes  total supply, circulating supply, total p burned, total c burned,  total x burned, total staked, total locked, total rewards,  and last updated.`,
    requestFormat: 'json',
    response: AvaxSupplyResponse,
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
    description: `Lists the most recent blocks from all supported EVM-compatible chains. The results can be filtered by network.`,
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
        schema: z.enum(['mainnet', 'fuji', 'testnet']).optional()
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
    description: `Lists the AvaCloud supported EVM-compatible chains. Filterable by network.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'network',
        type: 'Query',
        schema: z.enum(['mainnet', 'fuji', 'testnet']).optional()
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
    description: `Gets chain information for the EVM-compatible chain if supported by AvaCloud.`,
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
        schema: z.number().int().gte(1).lte(500).optional().default(10)
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
        schema: z.number().int().gte(1).lte(500).optional().default(10)
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
        schema: z.number().int().gte(1).lte(500).optional().default(10)
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
        schema: z.number().int().gte(1).lte(500).optional().default(10)
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

Note that the internal transactions list only contains &#x60;CALL&#x60; or &#x60;CALLCODE&#x60; transactions with a non-zero value and &#x60;CREATE&#x60;/&#x60;CREATE2&#x60;/&#x60;CREATE3&#x60; transactions. To get a complete list of internal transactions use the &#x60;debug_&#x60; prefixed RPC methods on an archive node.`,
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
    description: `Check the health of the service. This checks the read and write health of the database and cache.`,
    requestFormat: 'json',
    response: HealthCheckResultDto,
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
    path: '/v1/icm/addresses/:address/messages',
    alias: 'listIcmMessagesByAddress',
    description: `Lists ICM messages by address. Ordered by timestamp in descending order.`,
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
        schema: z.enum(['mainnet', 'fuji', 'testnet']).optional()
      }
    ],
    response: ListIcmMessagesResponse,
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
    path: '/v1/icm/messages',
    alias: 'listIcmMessages',
    description: `Lists ICM messages. Ordered by timestamp in descending order.`,
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
        schema: z.enum(['mainnet', 'fuji', 'testnet']).optional()
      }
    ],
    response: ListIcmMessagesResponse,
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
    path: '/v1/icm/messages/:messageId',
    alias: 'getIcmMessage',
    description: `Gets an ICM message by teleporter message ID.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'messageId',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.discriminatedUnion('status', [
      PendingIcmMessage,
      DeliveredIcmMessage,
      DeliveredSourceNotIndexedIcmMessage
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
    path: '/v1/live-check',
    alias: 'live-check',
    description: `Check the liveliness of the service (reads only).`,
    requestFormat: 'json',
    response: HealthCheckResultDto,
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.number().int().gte(1).lte(10000).optional().default(100)
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
    path: '/v1/networks/:network/blockchains/:blockchainId',
    alias: 'getBlockchainById',
    description: `Get details of the blockchain registered on the network.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
      }
    ],
    response: Blockchain,
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
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
    path: '/v1/networks/:network/blockchains/:blockchainId/lastActivityTimestampByAddresses',
    alias: 'getLastActivityTimestampByAddresses',
    description: `Gets the last activity timestamp for the supplied addresses on one of the Primary Network chains.`,
    requestFormat: 'json',
    parameters: [
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
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
      },
      {
        name: 'minUtxoAmount',
        type: 'Query',
        schema: z.number().gte(0).optional()
      }
    ],
    response: LastActivityTimestamp,
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
    path: '/v1/networks/:network/blockchains/:blockchainId/lastActivityTimestampByAddresses',
    alias: 'getLastActivityTimestampByAddressesV2',
    description: `Gets the last activity timestamp for the supplied addresses on one of the Primary Network chains. V2 route supports querying for more addresses.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ addresses: z.string() }).passthrough()
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
      },
      {
        name: 'minUtxoAmount',
        type: 'Query',
        schema: z.number().gte(0).optional()
      }
    ],
    response: LastActivityTimestamp,
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
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
      },
      {
        name: 'assetId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'minUtxoAmount',
        type: 'Query',
        schema: z.number().gte(0).optional()
      },
      {
        name: 'includeSpent',
        type: 'Query',
        schema: z.boolean().optional()
      },
      {
        name: 'sortBy',
        type: 'Query',
        schema: z.enum(['timestamp', 'amount']).optional()
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
    method: 'post',
    path: '/v1/networks/:network/blockchains/:blockchainId/utxos',
    alias: 'getUtxosByAddressesV2',
    description: `Lists UTXOs on one of the Primary Network chains for the supplied addresses. This v2 route supports increased page size and address limit.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ addresses: z.string() }).passthrough()
      },
      {
        name: 'pageToken',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number().int().gte(1).lte(1024).optional().default(10)
      },
      {
        name: 'blockchainId',
        type: 'Path',
        schema: z.enum([
          '11111111111111111111111111111111LpoYY',
          '2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM',
          '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm',
          '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5',
          'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp',
          'p-chain',
          'x-chain',
          'c-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
      },
      {
        name: 'assetId',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'minUtxoAmount',
        type: 'Query',
        schema: z.number().gte(0).optional()
      },
      {
        name: 'includeSpent',
        type: 'Query',
        schema: z.boolean().optional()
      },
      {
        name: 'sortBy',
        type: 'Query',
        schema: z.enum(['timestamp', 'amount']).optional()
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
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
          'x-chain'
        ])
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.string().optional()
      },
      {
        name: 'includeInactiveL1Validators',
        type: 'Query',
        schema: z.boolean().optional()
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.number().int().gte(1).lte(10000).optional().default(100)
      },
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
    description: `Lists details for validators. By default, returns details for all validators.  The nodeIds parameter supports substring matching. Filterable by validation status, delegation capacity, time remaining, fee percentage, uptime performance, and subnet id.`,
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
    method: 'post',
    path: '/v1/notifications/access',
    alias: 'access',
    description: `Access notifications.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AccessRequest
      }
    ],
    response: z.object({ message: z.string() }).passthrough(),
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
    path: '/v1/notifications/subscribe',
    alias: 'subscribe',
    description: `Subscribe to receive notifications.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SubscribeRequest
      }
    ],
    response: z.object({ message: z.string() }).passthrough(),
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
    path: '/v1/notifications/subscriptions',
    alias: 'subscriptions',
    description: `Get subscriptions.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ accessToken: z.string() }).passthrough()
      }
    ],
    response: SubscriptionsResponse,
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
    path: '/v1/notifications/unsubscribe',
    alias: 'unsubscribe',
    description: `Unsubscribe from receiving notifications.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: UnsubscribeRequest
      }
    ],
    response: z.object({ message: z.string() }).passthrough(),
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
            'rpcMethod',
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
        name: 'rpcMethod',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'network',
        type: 'Query',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
      }
    ],
    response: PrimaryNetworkRpcUsageMetricsResponseDTO,
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
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
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
    path: '/v1/signatureAggregator/:network/aggregateSignatures/:txHash',
    alias: 'getAggregatedSignatures',
    description: `Get Aggregated Signatures for a P-Chain L1 related Warp Message.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'network',
        type: 'Path',
        schema: z.enum(['mainnet', 'fuji', 'testnet'])
      },
      {
        name: 'txHash',
        type: 'Path',
        schema: z.string()
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
    path: '/v1/subnetRpcUsageMetrics',
    alias: 'getSubnetRpcUsageMetrics',
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
    method: 'get',
    path: '/v1/transactions',
    alias: 'listLatestTransactionsAllChains',
    description: `Lists the most recent transactions from all supported EVM-compatible chains. The results can be filtered based on transaction status.`,
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
        schema: z.enum(['mainnet', 'fuji', 'testnet']).optional()
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
        schema: createWebhook_Body
      }
    ],
    response: z.union([
      EVMAddressActivityResponse,
      PrimaryNetworkAddressActivityResponse,
      ValidatorActivityResponse
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
    alias: 'generateOrRotateSharedSecret',
    description: `Generates a new shared secret or rotate an existing one.`,
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
    response: z.union([
      EVMAddressActivityResponse,
      PrimaryNetworkAddressActivityResponse,
      ValidatorActivityResponse
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
    response: z.union([
      EVMAddressActivityResponse,
      PrimaryNetworkAddressActivityResponse,
      ValidatorActivityResponse
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
    response: z.union([
      EVMAddressActivityResponse,
      PrimaryNetworkAddressActivityResponse,
      ValidatorActivityResponse
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
    method: 'patch',
    path: '/v1/webhooks/:id/addresses',
    alias: 'addAddressesToWebhook',
    description: `Add addresses to webhook. Only valid for EVM activity webhooks.`,
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
    response: EVMAddressActivityResponse,
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
    description: `Remove addresses from webhook. Only valid for EVM activity webhooks.`,
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
    response: EVMAddressActivityResponse,
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
    description: `List adresses by webhook. Only valid for EVM activity webhooks.`,
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
