// ============================================================
// BTC 多周期K线图组件
// lightweight-charts v5 (TradingView 内核)
// 显示: 蜡烛图 + EMA50/200 + 支撑/压力位 + 入场标记
// ============================================================

import { useEffect, useRef } from 'react'
import {
  createChart, ColorType,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  type IChartApi,
  type UTCTimestamp,
  type SeriesMarker,
} from 'lightweight-charts'
import type { Kline } from '@/lib/binance'

interface ChartMark {
  time: number
  position: 'aboveBar' | 'belowBar'
  color: string
  shape: 'arrowUp' | 'arrowDown'
  text: string
}

interface LrChannel {
  upper: number[]
  middle: number[]
  lower: number[]
}

interface KlineChartProps {
  klines: Kline[]
  ema50?: number[]
  ema200?: number[]
  lrChannel?: LrChannel
  supportZones?: { level: number; label: string }[]
  resistanceZones?: { level: number; label: string }[]
  entryMarks?: ChartMark[]
  height?: number
}

export default function KlineChart({
  klines, ema50, ema200, lrChannel,
  supportZones = [], resistanceZones = [],
  entryMarks = [], height = 500,
}: KlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current || klines.length === 0) return

    // Safety dispose of any previous chart (might be from StrictMode double-effect)
    if (chartRef.current) {
      try { chartRef.current.remove() } catch (_) { /* already disposed */ }
      chartRef.current = null
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af', fontSize: 11,
      },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#1e293b' },
      timeScale: { borderColor: '#1e293b', timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height,
    })
    chartRef.current = chart

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    candleSeries.setData(klines.map(k => ({
      time: k.time as UTCTimestamp, open: k.open, high: k.high, low: k.low, close: k.close,
    })))

    // EMA50
    if (ema50 && ema50.length > 0) {
      const offset = klines.length - ema50.length
      const line50 = chart.addSeries(LineSeries, { color: '#2979ff', lineWidth: 1.5, priceLineVisible: false, title: 'EMA50' })
      line50.setData(ema50.map((v, i) => ({ time: klines[offset + i]?.time as UTCTimestamp, value: v })).filter(d => d.time > 0 && isFinite(d.value)))
    }

    // EMA200
    if (ema200 && ema200.length > 0) {
      const offset = klines.length - ema200.length
      const line200 = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1.5, priceLineVisible: false, title: 'EMA200' })
      line200.setData(ema200.map((v, i) => ({ time: klines[offset + i]?.time as UTCTimestamp, value: v })).filter(d => d.time > 0 && isFinite(d.value)))
    }

    // 线性回归通道 (上轨/中线/下轨)
    if (lrChannel && lrChannel.upper.length > 0 && lrChannel.upper.length === lrChannel.middle.length) {
      const chOffset = klines.length - lrChannel.upper.length
      const chOpts = { priceLineVisible: false }
      const chData = (arr: number[]) => arr.map((v, i) => ({
        time: klines[chOffset + i]?.time as UTCTimestamp, value: v,
      })).filter(d => d.time > 0 && isFinite(d.value))
      chart.addSeries(LineSeries, { ...chOpts, color: '#6366f1', lineWidth: 1, lineStyle: 2, title: '通道上轨' }).setData(chData(lrChannel.upper))
      chart.addSeries(LineSeries, { ...chOpts, color: '#818cf8', lineWidth: 1.5, lineStyle: 0, title: '回归线' }).setData(chData(lrChannel.middle))
      chart.addSeries(LineSeries, { ...chOpts, color: '#6366f1', lineWidth: 1, lineStyle: 2, title: '通道下轨' }).setData(chData(lrChannel.lower))
    }

    // Support / Resistance lines
    for (const z of supportZones) {
      chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: 2, priceLineVisible: false })
        .setData([{ time: klines[0].time as UTCTimestamp, value: z.level }, { time: klines[klines.length - 1].time as UTCTimestamp, value: z.level }])
    }
    for (const z of resistanceZones) {
      chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: 2, priceLineVisible: false })
        .setData([{ time: klines[0].time as UTCTimestamp, value: z.level }, { time: klines[klines.length - 1].time as UTCTimestamp, value: z.level }])
    }

    // Entry markers
    if (entryMarks.length > 0) {
      createSeriesMarkers(candleSeries, entryMarks.map(m => ({
        time: m.time as UTCTimestamp, position: m.position, color: m.color, shape: m.shape, text: m.text,
      } as SeriesMarker<UTCTimestamp>)))
    }

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      try { chart.remove() } catch (_) { /* already disposed */ }
      if (chartRef.current === chart) chartRef.current = null
    }
  }, [klines, ema50, ema200, lrChannel, supportZones, resistanceZones, entryMarks, height])

  if (klines.length === 0) {
    return <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">加载K线数据中...</div>
  }

  return <div ref={containerRef} style={{ width: '100%', height }} className="rounded-lg overflow-hidden" />
}
