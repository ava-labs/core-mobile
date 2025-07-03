import { Network } from '@avalabs/core-chains-sdk'
import { MarkrQuote, MarkrTransaction } from 'features/swap/types';

const ORCHESTRATOR_URL = 'https://orchestrator.markr.io';

export async function buildSwapTransaction({
  quote,
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  appId,
  network,
  from,
  debug = false
}: {
  quote: MarkrQuote,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  minAmountOut: string,
  appId: string,
  network: Network,
  from: string,
  debug?: boolean
}): Promise<MarkrTransaction> {
  const { uuid } = quote
  const response = await fetch(`${ORCHESTRATOR_URL}/swap`, {
    method: 'POST',
    body: JSON.stringify({
      uuid,
      chainId: network.chainId,
      from,
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      appId,
      debug
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  return debug ? data.wrapped : data;
}
