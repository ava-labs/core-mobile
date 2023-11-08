// the compiled js version of the custom rules are referenced here
module.exports = {
  'no-direct-avax-comparison-operator':
    require('../lib/customRules/noDirectAvaxComparisonOperator').default
}
