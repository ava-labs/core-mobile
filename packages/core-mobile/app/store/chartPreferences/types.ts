export type ChartType = 'line' | 'candlestick'

export type ChartPreferencesState = {
  chartType: ChartType
}

export const initialState: ChartPreferencesState = {
  chartType: 'line'
}
