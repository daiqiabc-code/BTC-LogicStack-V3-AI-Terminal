// ============================================================
// Backtest Engine for BTC Logic Stack V3
// Calculates performance metrics from kline data + signals
// ============================================================

import type { Kline } from './binance'
import type { BacktestResult } from '@/types'
import { computeLogicStackScore } from './scoring'

/** Run backtest on kline data */
export function runBacktest(
  klines: Kline[],
): BacktestResult {
  const closes = klines.map(k => k.close)
  const totalTrades = Math.max(1, Math.floor(klines.length / 3))

  // Simulate trades based on scoring engine
  const trades: number[] = []
  const equityCurve: { date: string; value: number }[] = []
  let equity = 10000

  equityCurve.push({ date: new Date(klines[0].time * 1000).toISOString().slice(0, 10), value: equity })

  for (let i = 20; i < klines.length - 1; i += 3) {
    const slice15m = klines.slice(Math.max(0, i - 20), i + 1)
    const slice1h = klines.slice(Math.max(0, i - 60), i + 1)
    const slice4h = klines.slice(Math.max(0, i - 200), i + 1)

    if (slice15m.length < 20 || slice1h.length < 20 || slice4h.length < 20) continue

    const result = computeLogicStackScore(slice15m, slice1h, slice4h, 0.0001, 1e9, 1e10)
    const entryPrice = closes[i]
    const exitPrice = closes[i + 1]
    const direction = result.score.finalScore >= 60 ? 1 : result.score.finalScore <= 40 ? -1 : 0

    if (direction !== 0) {
      const pnl = ((exitPrice - entryPrice) / entryPrice) * direction * equity * 0.02
      trades.push(pnl / (equity * 0.02))
      equity += pnl
    }

    equityCurve.push({
      date: new Date(klines[i].time * 1000).toISOString().slice(0, 10),
      value: Math.round(equity * 100) / 100,
    })
  }

  // Calculate metrics
  const wins = trades.filter(t => t > 0)
  const losses = trades.filter(t => t < 0)
  const winRate = trades.length > 0 ? wins.length / trades.length : 0

  const totalReturn = (equity - 10000) / 10000
  const years = klines.length / (365 * 24 * 4) // assuming 4h bars
  const cagr = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0

  // Sharpe ratio (from trade returns)
  const avgReturn = trades.length > 0 ? trades.reduce((a, b) => a + b, 0) / trades.length : 0
  const stdReturn = trades.length > 1
    ? Math.sqrt(trades.reduce((sum, t) => sum + (t - avgReturn) ** 2, 0) / (trades.length - 1))
    : 0
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(365) : 0

  // Sortino (downside deviation only)
  const downside = trades.filter(t => t < 0)
  const downsideStd = downside.length > 1
    ? Math.sqrt(downside.reduce((sum, t) => sum + t ** 2, 0) / downside.length)
    : 1
  const sortino = downsideStd > 0 ? (avgReturn / downsideStd) * Math.sqrt(365) : 0

  // Max drawdown
  let peak = 10000
  let maxDD = 0
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value
    const dd = (peak - point.value) / peak
    if (dd > maxDD) maxDD = dd
  }

  // Calmar
  const calmar = maxDD > 0 ? cagr / maxDD : 0

  // Profit factor
  const grossProfit = wins.reduce((sum, t) => sum + t, 0)
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0

  // Average R (avg win / avg loss)
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 1
  const averageR = avgLoss > 0 ? avgWin / avgLoss : avgWin

  return {
    cagr: Math.round(cagr * 10000) / 100,
    sharpe: Math.round(sharpe * 100) / 100,
    sortino: Math.round(sortino * 100) / 100,
    calmar: Math.round(calmar * 100) / 100,
    maxDrawdown: Math.round(maxDD * 10000) / 100,
    winRate: Math.round(winRate * 10000) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    averageR: Math.round(averageR * 100) / 100,
    totalTrades: trades.length,
    equityCurve,
  }
}
