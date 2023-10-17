import { TSESLint, ESLintUtils, TSESTree } from '@typescript-eslint/utils'

const rule: TSESLint.RuleModule<'noBnBigComparisons'> = {
  defaultOptions: [],
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      noBnBigComparisons:
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

          const isBNorBig = (symbolName: string): boolean =>
            ['BN', 'Big'].includes(symbolName)

          if (
            leftTypeSymbolName &&
            rightTypeSymbolName &&
            (isBNorBig(leftTypeSymbolName) || isBNorBig(rightTypeSymbolName))
          ) {
            return context.report({
              node,
              messageId: 'noBnBigComparisons',
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
