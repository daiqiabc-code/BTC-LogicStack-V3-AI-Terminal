// ============================================================
// BTC Logic Stack V3 - Core Type Definitions
// ============================================================

/** Market regime types */
export type MarketRegime = 'bull' | 'bear' | 'range'

/** Trading signal direction */
export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL'

/** Trading mode */
export type TradingMode = 'paper' | 'live'

/** Theme mode */
export type ThemeMode = 'dark' | 'light'

// ============================================================
// Market Data
// ============================================================

export interface MarketOverview {
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  fundingRate: number
  openInterest: number
  fearGreedIndex: number
  regime: MarketRegime
  regimeConfidence: number
  updatedAt: number
}

// ============================================================
// Logic Stack Engine - Scoring
// ============================================================

export interface LayerScore {
  name: string
  score: number
  maxScore: number
  details: string[]
  status: 'pass' | 'warn' | 'fail'
}

export interface LogicStackScore {
  finalScore: number
  label: string
  layers: LayerScore[]
  timestamp: number
}

// ============================================================
// AI Prediction
// ============================================================

export interface AIPrediction {
  bullProbability: number
  bearProbability: number
  prediction: 'bull' | 'bear' | 'neutral'
  confidence: number
  features: Record<string, number>
  timestamp: number
}

// ============================================================
// Institution Flow
// ============================================================

export interface InstitutionFlow {
  fundingRate: number
  openInterest: number
  etfNetFlow: number
  whaleActivity: 'high' | 'normal' | 'low'
  longShortRatio: number
}

// ============================================================
// Trading Signal
// ============================================================

export interface TradingSignal {
  id: string
  direction: SignalDirection
  score: number
  timestamp: number
  reasons: string[]
  stopLoss: number
  takeProfit: number
  riskReward: number
  status: 'active' | 'executed' | 'expired' | 'cancelled'
}

// ============================================================
// Risk Management
// ============================================================

export interface RiskParams {
  accountBalance: number
  riskPercent: number
  maxPositionSize: number
  consecutiveLosses: number
  isPaused: boolean
  pauseUntil: number | null
}

export interface PositionCalc {
  positionSize: number
  stopLossPrice: number
  maxLoss: number
  entryPrice: number
}

// ============================================================
// Backtest
// ============================================================

export interface BacktestResult {
  cagr: number
  sharpe: number
  sortino: number
  calmar: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  averageR: number
  totalTrades: number
  equityCurve: { date: string; value: number }[]
}

// ============================================================
// AI Committee
// ============================================================

export interface CommitteeOpinion {
  agent: string
  role: string
  vote: 'bull' | 'bear' | 'neutral'
  confidence: number
  reasoning: string
}

export interface CommitteeConsensus {
  score: number
  opinions: CommitteeOpinion[]
  consensus: SignalDirection
}

// ============================================================
// Strategy Version
// ============================================================

export interface StrategyVersion {
  id: string
  name: string
  version: string
  createdAt: string
  description: string
  isActive: boolean
}

// ============================================================
// API Configuration
// ============================================================

export interface APIConfig {
  binance?: { apiKey: string; secretKey: string }
  okx?: { apiKey: string; secretKey: string; passphrase: string }
  tradingViewWebhook?: { url: string; secret: string }
  aiModel?: { endpoint: string; apiKey: string }
}

// ============================================================
// Daily Report
// ============================================================

export interface DailyReport {
  date: string
  summary: string
  signalsGenerated: number
  tradesExecuted: number
  winRate: number
  pnl: number
  score: number
  regime: MarketRegime
}
