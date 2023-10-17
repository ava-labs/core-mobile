"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const rule = {
    defaultOptions: [],
    meta: {
        type: 'problem',
        schema: [],
        messages: {
            noDirectAvaxComparisonOperator: 'Avoid using {{operator}} with {{symbol}} types. Use respective methods instead.'
        }
    },
    create: context => {
        const services = utils_1.ESLintUtils.getParserServices(context);
        const checker = services.program.getTypeChecker();
        return {
            BinaryExpression: (node) => {
                const expr = node;
                if (['<', '>', '==', '!='].includes(expr.operator)) {
                    const { symbol: { escapedName: leftTypeSymbolName } } = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(expr.left));
                    const { symbol: { escapedName: rightTypeSymbolName } } = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(expr.left));
                    const isAvax = (symbolName) => symbolName === 'Avax';
                    if (leftTypeSymbolName &&
                        rightTypeSymbolName &&
                        (isAvax(leftTypeSymbolName) || isAvax(rightTypeSymbolName))) {
                        return context.report({
                            node,
                            messageId: 'noDirectAvaxComparisonOperator',
                            data: {
                                operator: expr.operator,
                                symbol: leftTypeSymbolName
                            }
                        });
                    }
                }
            }
        };
    }
};
exports.default = rule;
