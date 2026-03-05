import type { QuoterDoneReason } from '@avalabs/unified-asset-transfer'

export class FusionQuoteError extends Error {
  constructor(message: string, public readonly reason?: QuoterDoneReason) {
    super(message)
    this.name = 'FusionQuoteError'
  }
}

export const fusionErrors = {
  // Quote errors
  noQuotes(): FusionQuoteError {
    return new FusionQuoteError(
      'No quotes available right now. Please try again.',
      'no-quotes'
    )
  },
  noEligibleServices(): FusionQuoteError {
    return new FusionQuoteError(
      'Swap not supported for this token pair.\nPlease try a different pair.',
      'no-eligible-services'
    )
  },

  // Service / initialisation errors
  serviceNotInitialized(): FusionQuoteError {
    return new FusionQuoteError('Fusion service is not initialized')
  },
  unknownServiceType(serviceType: string): FusionQuoteError {
    return new FusionQuoteError(`Unknown service type: ${serviceType}`)
  },

  // Type-conversion / validation errors
  erc721Unsupported(): FusionQuoteError {
    return new FusionQuoteError('ERC721 tokens are not supported for swaps')
  },
  erc1155Unsupported(): FusionQuoteError {
    return new FusionQuoteError('ERC1155 tokens are not supported for swaps')
  },
  missingDecimals(): FusionQuoteError {
    return new FusionQuoteError('Token must have decimals for swaps')
  },
  erc20MissingAddress(): FusionQuoteError {
    return new FusionQuoteError('ERC20 token must have an address')
  },
  splMissingAddress(): FusionQuoteError {
    return new FusionQuoteError('SPL token must have an address')
  },
  networkMissingCaip2(chainName: string): FusionQuoteError {
    return new FusionQuoteError(`Network ${chainName} is missing caip2Id`)
  },

  // Input validation errors (swap screen)
  enterAmount(): FusionQuoteError {
    return new FusionQuoteError('Please enter an amount')
  },
  exceedsBalance(): FusionQuoteError {
    return new FusionQuoteError('Amount exceeds available balance')
  },
  noDestinationToken(symbol: string): FusionQuoteError {
    return new FusionQuoteError(`You don't have any ${symbol} token for swap`)
  },
  incompatibleNetworks(fromSymbol: string, toSymbol: string): FusionQuoteError {
    return new FusionQuoteError(
      `Cannot swap from ${fromSymbol} network to ${toSymbol} network. Please select a different token.`
    )
  }
}
