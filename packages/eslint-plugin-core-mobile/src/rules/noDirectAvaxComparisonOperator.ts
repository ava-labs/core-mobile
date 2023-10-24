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
          const {
            symbol: { escapedName: leftTypeSymbolName }
          } = checker.getTypeAtLocation(
            services.esTreeNodeToTSNodeMap.get(expr.left)
          )
          const {
            symbol: { escapedName: rightTypeSymbolName }
          } = checker.getTypeAtLocation(
            services.esTreeNodeToTSNodeMap.get(expr.left)
          )

          const isAvax = (symbolName: string): boolean => symbolName === 'Avax'

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
