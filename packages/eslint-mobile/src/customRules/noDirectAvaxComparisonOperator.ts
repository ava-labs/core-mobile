import { TSESLint, ESLintUtils, TSESTree } from '@typescript-eslint/utils'

const rule: TSESLint.RuleModule<'noDirectAvaxComparisonOperator'> = {
  defaultOptions: [],
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      noDirectAvaxComparisonOperator:
        'Avoid using {{operator}} with {{symbol}} types. Use respective methods instead.'
    }
  },
  create: context => {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()

    return {
      BinaryExpression: (node: TSESTree.Node) => {
        const expr = node as TSESTree.BinaryExpression
        if (['<', '>', '==', '!='].includes(expr.operator)) {
          const { symbol: leftSymbol } = checker.getTypeAtLocation(
            services.esTreeNodeToTSNodeMap.get(expr.left)
          )
          const { symbol: rightSymbol } = checker.getTypeAtLocation(
            services.esTreeNodeToTSNodeMap.get(expr.left)
          )

          const isAvax = (symbolName: string): boolean => symbolName === 'Avax'

          const leftTypeSymbolName = leftSymbol?.escapedName
          const rightTypeSymbolName = rightSymbol?.escapedName

          if (
            leftTypeSymbolName &&
            rightTypeSymbolName &&
            (isAvax(leftTypeSymbolName) || isAvax(rightTypeSymbolName))
          ) {
            return context.report({
              node,
              messageId: 'noDirectAvaxComparisonOperator',
              data: {
                operator: expr.operator,
                symbol: leftTypeSymbolName
              }
            })
          }
        }
      }
    }
  }
}

export default rule
