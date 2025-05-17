/**
 * @typedef {import("expo/config-plugins").ConfigPlugin} ConfigPlugin
 */

const { withAndroidStyles } = require('expo/config-plugins')

/**
 * A config plugin that modifies Android styles to use DayNight theme
 * @type {ConfigPlugin}
 */
const withAndroidDayNightTheme = initialConfig =>
  withAndroidStyles(initialConfig, newConfig => {
    const { style = [] } = newConfig.modResults.resources
    if (!style.length) {
      return newConfig
    }

    newConfig.modResults.resources.style = style
      .map(styleItem => {
        if (styleItem.$ && styleItem.$.name === 'AppTheme') {
          // We remove color hardcoding that would break day/night
          // but keep existing parent theme to avoid conflict with rn-edge-to-edge
          const excludedAttributes = ['android:textColor']

          styleItem.item = styleItem.item.filter(
            ({ $ }) => !excludedAttributes.includes($.name)
          )
        }

        // Remove hardcoded styles in ResetEditText style too
        if (styleItem.$ && styleItem.$.name === 'ResetEditText') {
          const excludedAttributes = [
            'android:textColor',
            'android:textColorHint'
          ]

          styleItem.item = styleItem.item.filter(
            ({ $ }) => !excludedAttributes.includes($.name)
          )
        }

        return styleItem
      })
      .filter(s => s !== null)

    return newConfig
  })

module.exports = withAndroidDayNightTheme
