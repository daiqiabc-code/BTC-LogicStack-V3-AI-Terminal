// ============================================================
// BTC Logic Stack V3 - Scoring Engine
// Three-layer AI-driven trading score
// ============================================================

import type { Kline } from './binance'
import type { LayerScore, LogicStackScore, MarketRegime, AIPrediction } from '@/types'

// ============================================================
// Technical indicator helpers
// ============================================================

function ema(data: number[], period: number): number[] {
  const result: number[] = []
  const k = 2 / (period + 1)
  let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(prev)
  for (let i = period; i < data.length; i++) {
    prev = data[i] * k + prev * (1 - k)
    result.push(prev)
  }
  return result
}

function sma(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = period - 1; i < data.length; i++) {
    result.push(data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period)
  }
  return result
}

function atr(klines: Kline[], period = 14): number {
  if (klines.length < period + 1) return 0
  const trs: number[] = []
  for (let i = 1; i <= period; i++) {
    const high = klines[i].high
    const low = klines[i].low
    const prevClose = klines[i - 1].close
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)))
  }
  return trs.reduce((a, b) => a + b, 0) / period
}

function adx(klines: Kline[], period = 14): number {
  if (klines.length < period * 2) return 0
  const highs = klines.map(k => k.high)
  const lows = klines.map(k => k.low)
  const closes = klines.map(k => k.close)

  const plusDM: number[] = []
  const minusDM: number[] = []
  const tr: number[] = []

  for (let i = 1; i < klines.length; i++) {
    const upMove = highs[i] - highs[i - 1]
    const downMove = lows[i - 1] - lows[i]
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ))
  }

  const smoothTR = sma(tr, period)
  const smoothPDM = sma(plusDM, period)
  const smoothMDM = sma(minusDM, period)
  if (smoothTR.length === 0 || smoothTR[smoothTR.length - 1] === 0) return 0

  const pdi = 100 * smoothPDM[smoothPDM.length - 1] / smoothTR[smoothTR.length - 1]
  const mdi = 100 * smoothMDM[smoothMDM.length - 1] / smoothTR[smoothTR.length - 1]
  const dx = Math.abs(pdi - mdi) / (pdi + mdi) * 100

  const dxValues = [dx]
  const adxValue = dxValues.reduce((a, b) => a + b, 0) / dxValues.length
  return Math.round(adxValue * 10) / 10
}

function rsi(klines: Kline[], period = 14): number {
  if (klines.length < period + 1) return 50
  const closes = klines.map(k => k.close)
  let gain = 0, loss = 0
  for (let i = closes.length - period; i < closes.length - 1; i++) {
    const diff = closes[i + 1] - closes[i]
    if (diff > 0) gain += diff
    else loss -= diff
  }
  if (loss === 0) return 100
  const rs = gain / loss / period
  return Math.round(100 - 100 / (1 + rs))
}

// ============================================================
// Layer 1: Market Direction (max 30 pts)
// ============================================================
function scoreMarketDirection(klines4h: Kline[]): LayerScore {
  const closes = klines4h.map(k => k.close)
  const ema50Arr = ema(closes, 50)
  const ema200Arr = ema(closes, 200)
  const adxVal = adx(klines4h, 14)
  const currentPrice = closes[closes.length - 1]

  const ema50 = ema50Arr[ema50Arr.length - 1]
  const ema200 = ema200Arr.length > 0 ? ema200Arr[ema200Arr.length - 1] : 0
  const priceAboveEMA50 = currentPrice > ema50
  const emaBullish = ema50 > ema200
  const adxStrong = adxVal > 22

  let score = 0
  const details: string[] = []

  if (emaBullish) { score += 12; details.push(`EMA50(${ema50.toFixed(0)}) > EMA200(${ema200.toFixed(0)}) ✓`) }
  else details.push(`EMA50(${ema50.toFixed(0)}) < EMA200 (bearish)`)

  if (priceAboveEMA50) { score += 10; details.push(`Price $${currentPrice.toFixed(0)} above EMA50 ✓`) }
  else details.push(`Price below EMA50`)

  if (adxStrong) { score += 8; details.push(`ADX ${adxVal} > 22 (trending) ✓`) }
  else details.push(`ADX ${adxVal} ≤ 22 (weak trend)`)

  const status = score >= 22 ? 'pass' : score >= 15 ? 'warn' : 'fail'

  return { name: 'Market Direction', score, maxScore: 30, details, status }
}

// ============================================================
// Layer 2: Entry Location (max 40 pts)
// ============================================================
function scoreEntryLocation(klines4h: Kline[], klines1h: Kline[]): LayerScore {
  const closes = klines4h.map(k => k.close)
  const currentPrice = closes[closes.length - 1]

  // Recent highs/lows for support/resistance
  const recentHigh = Math.max(...closes.slice(-20))
  const recentLow = Math.min(...closes.slice(-20))
  const range = recentHigh - recentLow

  // Fib 0.618 level
  const fib618 = recentHigh - range * 0.618

  // 4H linear regression (simplified: mid-point of recent range)
  const midPoint = (recentHigh + recentLow) / 2
  const nearSupport = Math.abs(currentPrice - recentLow) < range * 0.15
  const nearFib = Math.abs(currentPrice - fib618) < range * 0.1
  const nearMid = Math.abs(currentPrice - midPoint) < range * 0.1

  // Liquidity sweep detection: price dipped below recent low then recovered
  const sweptLow = klines4h.slice(-5).some(k => k.low < recentLow)

  let score = 0
  const details: string[] = []

  if (nearSupport) { score += 15; details.push(`Near 4H support zone ~$${recentLow.toFixed(0)} ✓`) }
  else details.push(`Away from 4H support zone`)

  if (nearFib) { score += 12; details.push(`Fib 0.618 retrace at $${fib618.toFixed(0)} ✓`) }
  else details.push(`Not at Fib 0.618 level`)

  if (sweptLow) { score += 8; details.push(`Liquidity sweep detected (low swept) ✓`) }
  else details.push(`No liquidity sweep`)

  if (nearMid) { score += 5; details.push(`Near channel midpoint ✓`) }

  const status = score >= 28 ? 'pass' : score >= 18 ? 'warn' : 'fail'

  return { name: 'Entry Location', score, maxScore: 40, details, status }
}

// ============================================================
// Layer 3: 15m Trigger (max 30 pts)
// ============================================================
function scoreTrigger(klines15m: Kline[]): LayerScore {
  const closes = klines15m.map(k => k.close)
  const volumes = klines15m.map(k => k.volume)
  const currentPrice = closes[closes.length - 1]

  // Check Higher Low pattern (last 20 bars)
  const recentSegment = closes.slice(-20)
  const midIndex = Math.floor(recentSegment.length / 2)
  const firstHalfLow = Math.min(...recentSegment.slice(0, midIndex))
  const secondHalfLow = Math.min(...recentSegment.slice(midIndex))
  const higherLow = secondHalfLow > firstHalfLow

  // Break previous high (last 10 bars)
  const prevHigh = Math.max(...closes.slice(-12, -1))
  const breakHigh = currentPrice > prevHigh

  // Volume expansion: compare last 3 volumes to avg of previous 10
  const recentVolAvg = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3
  const prevVolAvg = volumes.slice(-13, -3).reduce((a, b) => a + b, 0) / 10
  const volumeExpansion = recentVolAvg > prevVolAvg * 1.2

  let score = 0
  const details: string[] = []

  if (higherLow) { score += 12; details.push(`Higher Low formed ✓`) }
  else details.push(`No Higher Low pattern`)

  if (breakHigh) { score += 10; details.push(`Break of previous high ✓`) }
  else details.push(`No breakout of previous high`)

  if (volumeExpansion) { score += 8; details.push(`Volume expansion (${(recentVolAvg / prevVolAvg).toFixed(1)}x avg) ✓`) }
  else details.push(`Volume below average`)

  const status = score >= 20 ? 'pass' : score >= 12 ? 'warn' : 'fail'

  return { name: '15m Trigger', score, maxScore: 30, details, status }
}

// ============================================================
// AI Prediction Engine (XGBoost model interface ready)
// ============================================================
function aiPrediction(
  klines4h: Kline[],
  klines1h: Kline[],
  fundingRate: number,
  oi: number,
  volume24h: number,
): AIPrediction {
  const closes = klines4h.map(k => k.close)
  const closes4h = klines4h.map(k => k.close)
  const ema50Arr = ema(closes4h, 50)
  const ema200Arr = ema(closes4h, 200)
  const adxVal = adx(klines4h, 14)
  const atrVal = atr(klines4h, 14)
  const rsiVal = rsi(klines4h, 14)

  // MACD
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1]

  // Simplified probabilistic model (placeholder for XGBoost)
  // In production, this calls an external XGBoost model API
  let bullScore = 50

  // Trend factor (+15)
  if (ema50Arr.length > 0 && ema200Arr.length > 0 && ema50Arr[ema50Arr.length - 1] > ema200Arr[ema200Arr.length - 1]) bullScore += 10
  if (closes[closes.length - 1] > (ema50Arr[ema50Arr.length - 1] || 0)) bullScore += 5

  // Momentum factor (+10)
  if (macdLine > 0) bullScore += 5
  if (adxVal > 22) bullScore += 5

  // RSI factor (+5)
  if (rsiVal > 50 && rsiVal < 70) bullScore += 5
  else if (rsiVal >= 70) bullScore -= 5

  // Funding rate (+5)
  if (fundingRate > 0 && fundingRate < 0.0005) bullScore += 5
  else if (fundingRate > 0.001) bullScore -= 5

  // OI + Volume (+5)
  if (oi > 0 && volume24h > 0) bullScore += 5

  // Clamp
  const bullProb = Math.max(5, Math.min(95, bullScore))
  const bearProb = 100 - bullProb

  return {
    bullProbability: bullProb,
    bearProbability: bearProb,
    prediction: bullProb > 60 ? 'bull' : bullProb < 40 ? 'bear' : 'neutral',
    confidence: Math.round(50 + Math.abs(bullProb - 50) * 0.6),
    features: {
      ema50: ema50Arr[ema50Arr.length - 1] || 0,
      ema200: ema200Arr[ema200Arr.length - 1] || 0,
      adx: adxVal,
      atr: atrVal,
      rsi: rsiVal,
      macd: macdLine,
      fundingRate,
    },
    timestamp: Date.now() / 1000,
  }
}

// ============================================================
// Main scoring function
// ============================================================
export function computeLogicStackScore(
  klines15m: Kline[],
  klines1h: Kline[],
  klines4h: Kline[],
  fundingRate: number,
  oi: number,
  volume24h: number,
): { score: LogicStackScore; regime: { regime: MarketRegime; confidence: number }; prediction: AIPrediction } {
  const layer1 = scoreMarketDirection(klines4h)
  const layer2 = scoreEntryLocation(klines4h, klines1h)
  const layer3 = scoreTrigger(klines15m)
  const layers = [layer1, layer2, layer3]
  const finalScore = layers.reduce((s, l) => s + l.score, 0)

  // Determine market regime
  const closes4h = klines4h.map(k => k.close)
  const ema50 = ema(closes4h, 50)
  const ema200 = ema(closes4h, 200)
  const adxVal = adx(klines4h, 14)
  const price = closes4h[closes4h.length - 1]

  const ema50Val = ema50[ema50.length - 1] || 0
  const ema200Val = ema200.length > 0 ? ema200[ema200.length - 1] : 0

  let regime: MarketRegime
  let confidence: number

  if (price > ema50Val && ema50Val > ema200Val && adxVal > 20) {
    regime = 'bull'
    confidence = Math.min(95, 60 + adxVal)
  } else if (price < ema50Val && ema50Val < ema200Val && adxVal > 20) {
    regime = 'bear'
    confidence = Math.min(95, 60 + adxVal)
  } else {
    regime = 'range'
    confidence = Math.max(40, 60 - adxVal)
  }

  // Score label
  const label = finalScore >= 90 ? 'Strong Long Opportunity' :
    finalScore >= 75 ? 'Moderate Long Opportunity' :
    finalScore >= 60 ? 'Neutral' : 'No Signal'

  const prediction = aiPrediction(klines4h, klines1h, fundingRate, oi, volume24h)

  return {
    score: { finalScore, label, layers, timestamp: Date.now() / 1000 },
    regime: { regime, confidence: Math.round(confidence) },
    prediction,
  }
}
