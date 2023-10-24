import { ContractParserHandler } from 'screens/rpc/util/types'
import { AddLiquidityParser } from './addLiquidity'
import { AddLiquidityAvaxParser } from './addLiquidityAVAX'
import { ApproveTxParser } from './approve'
import {
  SwapAvaxForExactTokensParser,
  SwapExactAvaxForTokensParser
} from './swapAvaxForExactTokens'
import {
  SwapExactTokensForAvaxParser,
  SwapTokensForExactAvaxParser
} from './swapExactTokensForAVAX'
import {
  SwapExactTokensForTokenParser,
  SwapTokensForExactTokensParser
} from './swapExactTokensForTokens'

export const contractParserMap = new Map<string, ContractParserHandler>([
  SwapExactTokensForTokenParser,
  SwapTokensForExactTokensParser,
  SwapAvaxForExactTokensParser,
  SwapExactAvaxForTokensParser,
  SwapExactTokensForAvaxParser,
  SwapTokensForExactAvaxParser,
  ApproveTxParser,
  AddLiquidityAvaxParser,
  AddLiquidityParser
])
