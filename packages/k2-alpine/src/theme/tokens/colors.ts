const black = {
  neutral900: '#1E1E24', // Black Russian
  neutral850: '#28282E' // Jaguar
}

const white = {
  neutral: '#FFFFFF', // White
  neutral50: '#F2F2F3' // White Lilac
}

const success = {
  success: '#3AC489', // Shamrock
  success2: '#47C4AF' // Puerto Rico
}

const glass = {
  light: 'rgba(255, 255, 255, 0.6)', // #FFFFFF
  light2: 'rgba(161, 161, 170, 0.25)', // #A1A1AA
  dark: 'rgba(40, 40, 46, 0.85)', // #28282E
  dark2: 'rgba(129, 129, 137, 0.6)', // #818189
  dark3: 'rgba(197, 197, 200, 0.25)' // #C5C5C8
}

const gradient = {
  green: {
    step0: '#1CC51D',
    stepF: '#47C4AF'
  },

  violetPink: {
    step0: '#B28DFA',
    step1: '#F9C1FC',
    step2: '#E47AC1',
    stepF: '#AD8BF8'
  },

  greenBlue: {
    step0: '#7FFBB3',
    step1: '#ABE3FB',
    stepF: '#80E5E7'
  },

  blueMagenta: {
    step0: '#7BDDFC',
    step1: '#E567FF',
    stepF: '#42C8FE'
  },

  yellowPink: {
    step0: '#FBF4B3',
    step1: '#E47AC1',
    step2: '#E47AC1',
    stepF: '#F4B591'
  },

  bluePink: {
    step0: '#30BEFE',
    stepF: '#FF7683'
  }
}

export const darkModeColors = {
  $primaryBackground: white.neutral,
  $primaryText: black.neutral850,

  $secondaryBackground: glass.dark3,
  $secondaryText: white.neutral,

  $tertiaryBackground: black.neutral900,
  $tertiaryText: white.neutral
}

export const lightModeColors = {
  $primaryBackground: black.neutral900,
  $primaryText: white.neutral,

  $secondaryBackground: glass.light2,
  $secondaryText: black.neutral850,

  $tertiaryBackground: white.neutral,
  $tertiaryText: black.neutral850
}
