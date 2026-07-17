import { useState, useEffect, useCallback } from 'react'
import { fetchKlines, type Kline } from '@/lib/binance'
import { computeLogicStackScore } from '@/lib/scoring'
import KlineChart from '@/components/charts/KlineChart'
import { BarChart3, RefreshCw } from 'lucide-react'

const TIMEFRAMES = [
  { key: '1d', label: '日线' },
  { key: '4h', label: '4小时' },
  { key: '1h', label: '1小时' },
  { key: '15m', label: '15分钟' },
  { key: '5m', label: '5分钟' },
]

function ema(data: number[], period: number): number[] {
  if (data.length < period) return []
  const result: number[] = []; const k = 2 / (period + 1)
  let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(prev)
  for (let i = period; i < data.length; i++) { prev = data[i] * k + prev * (1 - k); result.push(prev) }
  return result
}

/** 线性回归通道计算 */
function calcLRChannel(prices: number[], multiplier = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const n = prices.length
  if (n < 3) return { upper: [], middle: [], lower: [] }
  const indices = Array.from({ length: n }, (_, i) => i)
  const sumX = indices.reduce((a, b) => a + b, 0)
  const sumY = prices.reduce((a, b) => a + b, 0)
  const sumXY = indices.reduce((s, x, i) => s + x * prices[i], 0)
  const sumX2 = indices.reduce((s, x) => s + x * x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // regression line values
  const regLine = indices.map(x => intercept + slope * x)
  // standard deviation of residuals
  const residuals = prices.map((y, i) => y - regLine[i])
  const stdDev = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n)
  const upper = regLine.map(v => v + stdDev * multiplier)
  const lower = regLine.map(v => v - stdDev * multiplier)
  return { upper, middle: regLine, lower }
}

export default function MarketChart() {
  const [tf, setTf] = useState('4h')
  const [klines, setKlines] = useState<Kline[]>([])
  const [ema50, setEma50] = useState<number[]>([])
  const [ema200, setEma200] = useState<number[]>([])
  const [supportZones, setSupportZones] = useState<{ level: number; label: string }[]>([])
  const [resistanceZones, setResistanceZones] = useState<{ level: number; label: string }[]>([])
  const [lrChannel, setLrChannel] = useState<{ upper: number[]; middle: number[]; lower: number[] }>({ upper: [], middle: [], lower: [] })
  const [entryMarks, setEntryMarks] = useState<{ time: number; position: 'aboveBar' | 'belowBar'; color: string; shape: 'arrowUp' | 'arrowDown'; text: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [signal, setSignal] = useState<string>('')
  const [error, setError] = useState<string>('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      // 1d needs 300+ bars for EMA200 calculation; others need 200+
      const limit = tf === '1d' ? 300 : 200
      const kData = await fetchKlines('BTCUSDT', tf, limit)
      if (kData.length < 50) {
        setError(`数据不足：仅有 ${kData.length} 根K线`)
        setLoading(false)
        return
      }
      setKlines(kData)

      const closes = kData.map(k => k.close)
      const e50 = ema(closes, 50)
      const e200 = ema(closes, 200)
      // Guard: if EMA returns empty, fill with empty arrays (chart shows no lines)
      setEma50(e50.length > 0 ? e50 : [])
      setEma200(e200.length > 0 ? e200 : [])
      // 线性回归通道（基于最近40根K线）
      const channelData = closes.length > 40 ? closes.slice(-40) : closes
      setLrChannel(calcLRChannel(channelData, 2))

      // Scoring — fetch independent timeframes for the V3 engine
      const snap15m = tf !== '15m' && tf !== '5m' ? await fetchKlines('BTCUSDT', '15m', 100).catch(() => []) : kData
      const snap1h = !['1h', '4h', '1d'].includes(tf) ? await fetchKlines('BTCUSDT', '1h', 100).catch(() => []) : kData
      const snap4h = tf !== '4h' && tf !== '1d' ? await fetchKlines('BTCUSDT', '4h', 100).catch(() => []) : kData

      const hasScoringData = (d: Kline[]) => d.length >= 20
      const result = computeLogicStackScore(
        hasScoringData(snap15m) ? snap15m : kData,
        hasScoringData(snap1h) ? snap1h : kData,
        hasScoringData(snap4h) ? snap4h : kData,
        0.0001, 1e9, 1e10,
      )
      setScore(result.score.finalScore)

      // Support / Resistance zones
      const currentPrice = closes[closes.length - 1]
      const recentHigh = Math.max(...closes.slice(-30))
      const recentLow = Math.min(...closes.slice(-30))
      const range = recentHigh - recentLow || 100
      const supports: { level: number; label: string }[] = []
      const resists: { level: number; label: string }[] = []
      supports.push({ level: recentLow, label: `支撑 $${recentLow.toFixed(0)}` })
      resists.push({ level: recentHigh, label: `压力 $${recentHigh.toFixed(0)}` })
      const fib236 = recentLow + range * 0.236
      const fib618 = recentHigh - range * 0.618
      if (currentPrice <= fib618) supports.push({ level: fib618, label: 'Fib 0.618' })
      else resists.push({ level: fib618, label: 'Fib 0.618' })
      supports.push({ level: fib236, label: 'Fib 0.236' })
      resists.push({ level: recentHigh - range * 0.236, label: 'Fib 0.764' })
      setSupportZones(supports)
      setResistanceZones(resists)

      // Entry markers
      const marks: typeof entryMarks = []
      const l1 = result.score.layers[0]
      const l2 = result.score.layers[1]
      const l3 = result.score.layers[2]
      if (l1?.status === 'pass' && l2?.status === 'pass') {
        marks.push({
          time: kData[kData.length - 1].time,
          position: 'belowBar', color: '#22c55e', shape: 'arrowUp',
          text: l3?.status === 'pass' ? '强烈做多' : '做多机会',
        })
        setSignal(l3?.status === 'pass' ? '强烈做多信号' : '做多信号')
      } else if (l1?.status === 'fail') {
        marks.push({
          time: kData[kData.length - 1].time,
          position: 'aboveBar', color: '#ef4444', shape: 'arrowDown',
          text: '空头信号',
        })
        setSignal('空头信号')
      } else {
        setSignal('无明确信号')
      }
      setEntryMarks(marks)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`数据加载失败: ${msg}`)
      console.error('MarketChart error:', err)
    } finally {
      setLoading(false)
    }
  }, [tf])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">行情图表</h1>
          <p className="text-xs text-muted-foreground mt-1">BTC/USDT 多周期K线 · 交易通道 · 入场机会</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-muted text-muted-foreground hover:bg-accent" disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />刷新
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
          {TIMEFRAMES.map(t => (
            <button key={t.key} onClick={() => setTf(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tf === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">V3评分:</span>
          <span className={`text-lg font-bold font-mono ${score >= 75 ? 'text-bull' : score >= 60 ? 'text-signal-yellow' : 'text-muted-foreground'}`}>{score}/100</span>
          {signal && (
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              signal === '强烈做多信号' ? 'bg-bull/20 text-bull' :
              signal === '做多信号' ? 'bg-signal-yellow/20 text-signal-yellow' :
              signal === '空头信号' ? 'bg-bear/20 text-bear' : 'bg-muted/30 text-muted-foreground'
            }`}>{signal}</span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-bear/10 border border-bear/20 text-sm text-bear font-mono">
          ⚠️ {error}
          <button onClick={loadData} className="ml-3 underline text-xs">重试</button>
        </div>
      )}

      <div className="trading-card !p-2">
        {loading ? (
          <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">
            <BarChart3 size={24} className="mr-2 animate-pulse" />加载K线数据中...
          </div>
        ) : klines.length > 0 ? (
          <KlineChart
            klines={klines}
            ema50={ema50}
            ema200={ema200}
            lrChannel={lrChannel}
            supportZones={supportZones}
            resistanceZones={resistanceZones}
            entryMarks={entryMarks}
            height={560}
          />
        ) : (
          <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">暂无数据</div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#2979ff]" /> EMA50</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#f59e0b]" /> EMA200</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#818cf8]" /> 回归线</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-[#6366f1]" /> 通道轨</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-bull" /> 支撑位</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-bear" /> 压力位</span>
        <span className="flex items-center gap-1"><span className="text-bull">▲</span> 做多信号</span>
        <span className="flex items-center gap-1"><span className="text-bear">▼</span> 做空信号</span>
      </div>
    </div>
  )
}
