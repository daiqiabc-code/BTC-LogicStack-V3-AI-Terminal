// ============================================================
// Binance Futures API - Data Layer
// BTC Logic Stack V3
// Uses Binance USDⓈ-M Contract API (fapi.binance.com)
// ============================================================

const BASE = 'https://fapi.binance.com'

/** Kline data point */
export interface Kline {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** 24hr ticker */
export interface Ticker24h {
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
}

/** Funding rate data */
export interface FundingInfo {
  fundingRate: number
  nextFundingTime: number
}

/** Open Interest */
export interface OpenInterest {
  openInterest: number
}

// ============================================================
// Fetch kline/candlestick data
// ============================================================
export async function fetchKlines(symbol: string, interval: string, limit = 100): Promise<Kline[]> {
  const url = `${BASE}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Binance kline error: ${res.status}`)
  const data = await res.json()
  return data.map((d: any) => ({
    time: d[0] / 1000,
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
  }))
}

// ============================================================
// Fetch 24hr ticker
// ============================================================
export async function fetchTicker24h(symbol: string): Promise<Ticker24h> {
  const url = `${BASE}/fapi/v1/ticker/24hr?symbol=${symbol}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Binance ticker error: ${res.status}`)
  const d = await res.json()
  return {
    price: parseFloat(d.lastPrice),
    change: parseFloat(d.priceChange),
    changePercent: parseFloat(d.priceChangePercent),
    volume: parseFloat(d.volume),
    high: parseFloat(d.highPrice),
    low: parseFloat(d.lowPrice),
  }
}

// ============================================================
// Fetch funding rate
// ============================================================
export async function fetchFundingRate(symbol: string): Promise<FundingInfo> {
  const url = `${BASE}/fapi/v1/premiumIndex?symbol=${symbol}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Binance funding error: ${res.status}`)
  const d = await res.json()
  return {
    fundingRate: parseFloat(d.lastFundingRate),
    nextFundingTime: d.nextFundingTime,
  }
}

// ============================================================
// Fetch open interest
// ============================================================
export async function fetchOpenInterest(symbol: string): Promise<OpenInterest> {
  const url = `${BASE}/fapi/v1/openInterest?symbol=${symbol}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Binance OI error: ${res.status}`)
  const d = await res.json()
  return { openInterest: parseFloat(d.openInterest) }
}

// ============================================================
// Fetch all market data in parallel
// ============================================================
export interface MarketDataSnapshot {
  klines1h: Kline[]
  klines4h: Kline[]
  klines15m: Kline[]
  ticker: Ticker24h
  funding: FundingInfo
  openInterest: OpenInterest
}

export async function fetchMarketSnapshot(): Promise<MarketDataSnapshot> {
  const symbol = 'BTCUSDT'
  const [klines15m, klines1h, klines4h, ticker, funding, oi] = await Promise.all([
    fetchKlines(symbol, '15m', 100),
    fetchKlines(symbol, '1h', 100),
    fetchKlines(symbol, '4h', 100),
    fetchTicker24h(symbol),
    fetchFundingRate(symbol),
    fetchOpenInterest(symbol),
  ])
  return { klines15m, klines1h, klines4h, ticker, funding, openInterest: oi }
}
