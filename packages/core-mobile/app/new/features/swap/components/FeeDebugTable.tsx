import { bigintToBig } from '@avalabs/core-utils-sdk'
import React from 'react'
import { useSelector } from 'react-redux'
import { StyleSheet, Text, View } from 'react-native'
import { selectFusionFeeUnitsMarginBps } from 'store/posthog'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'

type Props = {
  decimals: number
  maxRawGasFee: bigint | undefined
  maxBufferedGasFee: bigint | undefined
  maxGasSafetyBps: number
  liveRawGasFee: bigint | undefined
  liveBufferedGasFee: bigint | undefined
  maxRawAdditiveFee: bigint
  maxBufferedAdditiveFee: bigint
  maxRouteAdditiveBps: number
  liveRawAdditiveFee: bigint
  liveBufferedAdditiveFee: bigint
  liveGasSafetyBps: number
  liveRouteAdditiveBps: number
  maxRawNativeAdditiveFee: bigint
  maxBufferedNativeAdditiveFee: bigint
  liveRawNativeAdditiveFee: bigint
  liveBufferedNativeAdditiveFee: bigint
  nativeDecimals?: number
}

const format = (raw: bigint | undefined, decimals: number): string =>
  raw !== undefined ? bigintToBig(raw, decimals).toFixed(6) : '...'

export const FeeDebugTable = ({
  decimals,
  maxRawGasFee,
  maxBufferedGasFee,
  maxGasSafetyBps,
  liveRawGasFee,
  liveBufferedGasFee,
  maxRawAdditiveFee,
  maxBufferedAdditiveFee,
  maxRouteAdditiveBps,
  liveRawAdditiveFee,
  liveBufferedAdditiveFee,
  liveGasSafetyBps,
  liveRouteAdditiveBps,
  maxRawNativeAdditiveFee,
  maxBufferedNativeAdditiveFee,
  liveRawNativeAdditiveFee,
  liveBufferedNativeAdditiveFee,
  nativeDecimals = 18
}: Props): React.ReactElement | null => {
  const feeUnitsMarginBps = useSelector(selectFusionFeeUnitsMarginBps)

  if (!__DEV__ || !DevDebuggingConfig.SWAP_FEE_DEBUG_TABLE) return null

  const f = (raw: bigint | undefined): string => format(raw, decimals)
  const fn = (raw: bigint | undefined): string => format(raw, nativeDecimals)

  return (
    <View style={styles.table}>
      {/* Header row */}
      <View style={[styles.row, styles.rowBorder]}>
        <Text style={[styles.cell, styles.label]} />
        <Text style={[styles.cell, styles.header]}>max</Text>
        <Text style={[styles.cell, styles.header]}>live</Text>
      </View>
      {/* Gas raw row */}
      <View style={[styles.row, styles.rowBorder]}>
        <Text style={[styles.cell, styles.label]}>
          {`gas raw\n(+${feeUnitsMarginBps / 100}% built-in)`}
        </Text>
        <Text style={styles.cell}>{fn(maxRawGasFee)}</Text>
        <Text style={styles.cell}>{fn(liveRawGasFee)}</Text>
      </View>
      {/* Gas buffered row */}
      <View style={[styles.row, styles.rowBorder]}>
        <Text style={[styles.cell, styles.label]}>gas buffered</Text>
        <Text style={styles.cell}>
          {fn(maxBufferedGasFee)}
          <Text style={styles.bold}>{` (+${maxGasSafetyBps / 100}%)`}</Text>
        </Text>
        <Text style={styles.cell}>
          {fn(liveBufferedGasFee)}
          <Text style={styles.bold}>{` (+${liveGasSafetyBps / 100}%)`}</Text>
        </Text>
      </View>
      {/* Additive raw row */}
      <View style={[styles.row, styles.rowBorder]}>
        <Text style={[styles.cell, styles.label]}>additive raw</Text>
        <Text style={styles.cell}>{f(maxRawAdditiveFee)}</Text>
        <Text style={styles.cell}>{f(liveRawAdditiveFee)}</Text>
      </View>
      {/* Additive buffered row */}
      <View style={[styles.row, styles.rowBorder]}>
        <Text style={[styles.cell, styles.label]}>additive buffered</Text>
        <Text style={styles.cell}>
          {f(maxBufferedAdditiveFee)}
          <Text style={styles.bold}>{` (+${maxRouteAdditiveBps / 100}%)`}</Text>
        </Text>
        <Text style={styles.cell}>
          {f(liveBufferedAdditiveFee)}
          <Text style={styles.bold}>{` (+${
            liveRouteAdditiveBps / 100
          }%)`}</Text>
        </Text>
      </View>
      {/* Native additive raw row */}
      <View style={[styles.row, styles.rowBorder]}>
        <Text style={[styles.cell, styles.label]}>native add. raw</Text>
        <Text style={styles.cell}>{fn(maxRawNativeAdditiveFee)}</Text>
        <Text style={styles.cell}>{fn(liveRawNativeAdditiveFee)}</Text>
      </View>
      {/* Native additive buffered row */}
      <View style={styles.row}>
        <Text style={[styles.cell, styles.label]}>native add. buffered</Text>
        <Text style={styles.cell}>
          {fn(maxBufferedNativeAdditiveFee)}
          <Text style={styles.bold}>{` (+${maxRouteAdditiveBps / 100}%)`}</Text>
        </Text>
        <Text style={styles.cell}>
          {fn(liveBufferedNativeAdditiveFee)}
          <Text style={styles.bold}>{` (+${
            liveRouteAdditiveBps / 100
          }%)`}</Text>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6
  },
  row: {
    flexDirection: 'row'
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderColor: '#999'
  },
  cell: {
    flex: 1,
    fontSize: 11,
    padding: 4,
    textAlign: 'center',
    color: 'black'
  },
  header: {
    fontWeight: 'bold',
    color: 'black'
  },
  label: {
    textAlign: 'left',
    color: 'black'
  },
  bold: {
    fontWeight: 'bold',
    color: 'black'
  }
})
