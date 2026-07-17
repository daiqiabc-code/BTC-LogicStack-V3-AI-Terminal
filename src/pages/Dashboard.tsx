import { useState, useEffect, useCallback } from 'react'
import PriceBar from '@/components/dashboard/PriceBar'
import RegimeCard from '@/components/dashboard/RegimeCard'
import ScoreCard from '@/components/dashboard/ScoreCard'
import AIPredictionPanel from '@/components/dashboard/AIPredictionPanel'
import FlowPanel from '@/components/dashboard/FlowPanel'
import PriceChart from '@/components/dashboard/PriceChart'
import { fetchMarketSnapshot, type MarketDataSnapshot } from '@/lib/binance'
import { computeLogicStackScore } from '@/lib/scoring'
import type { MarketOverview, LayerScore, AIPrediction, MarketRegime } from '@/types'
import { Clock, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState<MarketDataSnapshot | null>(null)
  const [marketData, setMarketData] = useState<MarketOverview | null>(null)
  const [layers, setLayers] = useState<LayerScore[]>([])
  const [prediction, setPrediction] = useState<AIPrediction>({ bullProbability: 50, bearProbability: 50, prediction: 'neutral', confidence: 0, features: {}, timestamp: 0 })
  const [regime, setRegime] = useState<{ regime: MarketRegime; confidence: number }>({ regime: 'range', confidence: 0 })
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const snap = await fetchMarketSnapshot()
      setSnapshot(snap)
      const result = computeLogicStackScore(snap.klines15m, snap.klines1h, snap.klines4h, snap.funding.fundingRate, snap.openInterest.openInterest, parseFloat(snap.ticker.volume) * snap.ticker.price)
      setLayers(result.score.layers)
      setPrediction(result.prediction)
      setRegime(result.regime)
      setMarketData({
        price: snap.ticker.price, change24h: snap.ticker.change, changePercent24h: snap.ticker.changePercent,
        volume24h: snap.ticker.volume * snap.ticker.price, fundingRate: snap.funding.fundingRate,
        openInterest: snap.openInterest.openInterest, fearGreedIndex: Math.round(50 + result.prediction.bullProbability * 0.3),
        regime: result.regime.regime, regimeConfidence: result.regime.confidence, updatedAt: Date.now() / 1000,
      })
    } catch (err) {
      console.error('数据加载失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const finalScore = layers.reduce((sum, l) => sum + l.score, 0)

  const quickStats = [
    { label: 'V3评分', value: `${finalScore}/100`, change: '', isUp: finalScore >= 60 },
    { label: 'AI看涨', value: `${prediction.bullProbability}%`, change: `置信${prediction.confidence}%`, isUp: prediction.bullProbability > 50 },
    { label: '市场状态', value: regime.regime === 'bull' ? '多头' : regime.regime === 'bear' ? '空头' : '震荡', change: `${regime.confidence}%`, isUp: regime.regime === 'bull' },
    { label: '资金费率', value: marketData ? `${(marketData.fundingRate * 100).toFixed(4)}%` : '--', change: '', isUp: marketData ? marketData.fundingRate < 0.0008 : false },
  ]

  return (
    <div className="min-h-full flex flex-col">
      <PriceBar data={marketData} />
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-bold">控制台</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>{currentTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>
            <span>·</span>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Binance合约实时数据</span>
          </div>
        </div>
        <button onClick={loadData} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-muted text-muted-foreground hover:bg-accent">
          <RefreshCw size={12} />
          刷新
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <div key={stat.label} className="trading-card">
              <span className="trading-label">{stat.label}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="trading-value">{stat.value}</span>
                {stat.change && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.isUp ? 'text-bull' : 'text-bear'}`}>
                    {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <RegimeCard regime={regime.regime} confidence={regime.confidence} score={finalScore} />
            <PriceChart />
          </div>
          <div className="space-y-4">
            <ScoreCard finalScore={finalScore} layers={layers} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AIPredictionPanel bullProb={prediction.bullProbability} bearProb={prediction.bearProbability} confidence={prediction.confidence} />
          <FlowPanel fundingRate={marketData?.fundingRate ?? 0} openInterest={marketData?.openInterest ?? 0} etfFlow={124500000} whaleActivity="normal" longShortRatio={1.42} />
        </div>
      </div>
    </div>
  )
}
