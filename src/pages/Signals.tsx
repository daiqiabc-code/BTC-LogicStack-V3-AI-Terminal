import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Clock, Target, RefreshCw, AlertTriangle } from 'lucide-react'
import { fetchMarketSnapshot } from '@/lib/binance'
import { computeLogicStackScore } from '@/lib/scoring'
import type { TradingSignal } from '@/types'

export default function Signals() {
  const [signals, setSignals] = useState<TradingSignal[]>([])
  const [loading, setLoading] = useState(true)

  const generateSignals = useCallback(async () => {
    try {
      setLoading(true); const snap = await fetchMarketSnapshot()
      const result = computeLogicStackScore(snap.klines15m, snap.klines1h, snap.klines4h, snap.funding.fundingRate, snap.openInterest.openInterest, parseFloat(snap.ticker.volume) * snap.ticker.price)
      const { score, regime } = result; const price = snap.ticker.price; const atr = price * 0.015; const newSignals: TradingSignal[] = []
      if (score.finalScore >= 60) {
        newSignals.push({ id: `SIG-${Date.now().toString(36).toUpperCase()}`, direction: 'LONG', score: score.finalScore, timestamp: Date.now() / 1000,
          reasons: [...(score.layers[0]?.details?.filter(d => d.includes('✓'))?.slice(0, 2) || ['4H趋势分析']), ...(score.layers[1]?.details?.filter(d => d.includes('✓'))?.slice(0, 2) || ['入场区域确认']), ...(score.layers[2]?.details?.filter(d => d.includes('✓'))?.slice(0, 1) || ['触发条件满足']), regime.regime === 'bull' ? '多头趋势确认' : '', snap.funding.fundingRate < 0.0008 ? '资金费率健康' : ''].filter(Boolean),
          stopLoss: Math.round(price - atr * 1.5), takeProfit: Math.round(price + atr * 3), riskReward: Math.round(((atr * 3) / (atr * 1.5)) * 10) / 10, status: 'active' })
      }
      if (score.finalScore <= 40) {
        newSignals.push({ id: `SIG-${(Date.now() + 1).toString(36).toUpperCase()}`, direction: 'SHORT', score: 100 - score.finalScore, timestamp: Date.now() / 1000,
          reasons: ['空头市场结构', ...(score.layers[0]?.details?.slice(0, 1) || []), '风险规避信号'].filter(Boolean),
          stopLoss: Math.round(price + atr * 1.5), takeProfit: Math.round(price - atr * 3), riskReward: 2.0, status: 'active' })
      }
      setSignals(newSignals)
    } catch (err) { console.error('信号生成失败:', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { generateSignals() }, [generateSignals])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold">交易信号中心</h1><p className="text-xs text-muted-foreground mt-1">基于V3评分引擎动态生成的实时交易信号</p></div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">活跃信号:</span>
          <span className="text-lg font-bold font-mono text-bull">{signals.filter(s => s.status === 'active').length}</span>
          <button onClick={generateSignals} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-muted text-muted-foreground hover:bg-accent" disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />刷新
          </button>
        </div>
      </div>

      {loading ? (
        <div className="trading-card text-center py-8 text-sm text-muted-foreground">分析市场中...</div>
      ) : signals.length === 0 ? (
        <div className="trading-card text-center py-8">
          <div className="text-muted-foreground/40 mb-2"><AlertTriangle size={32} className="mx-auto" /></div>
          <div className="text-sm text-muted-foreground">当前无活跃信号</div>
          <div className="text-xs text-muted-foreground/60 mt-1">V3评分低于阈值(60)，市场条件不满足入场条件</div>
        </div>
      ) : (
        <div className="space-y-3">{signals.map((signal) => (
          <div key={signal.id} className={`trading-card border-l-4 ${signal.direction === 'LONG' ? 'border-l-bull' : 'border-l-bear'}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {signal.direction === 'LONG' ? <TrendingUp size={16} className="text-bull" /> : <TrendingDown size={16} className="text-bear" />}
                  <span className="text-sm font-bold">{signal.direction === 'LONG' ? 'BTC 做多' : 'BTC 做空'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-bull/10 text-bull capitalize">{signal.status === 'active' ? '活跃' : signal.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={10} />{new Date(signal.timestamp * 1000).toLocaleString('zh-CN')}</span>
                  <span className="flex items-center gap-1"><Target size={10} />{signal.id}</span>
                </div>
              </div>
              <div className="text-right"><span className="text-2xl font-bold font-mono text-signal-yellow">{signal.score}</span><div className="text-[10px] text-muted-foreground">评分</div></div>
            </div>
            <div className="mt-3 space-y-1">{signal.reasons.map((reason, i) => reason ? (
              <div key={i} className="flex items-start gap-2"><span className={signal.direction === 'LONG' ? 'text-bull mt-0.5' : 'text-bear mt-0.5'}>◆</span><span className="text-xs text-muted-foreground">{reason}</span></div>
            ) : null)}</div>
            <div className="mt-3 grid grid-cols-4 gap-3 p-3 rounded bg-muted/20">
              <div><span className="text-[10px] text-muted-foreground">止损</span><div className="text-sm font-mono font-semibold text-bear">${signal.stopLoss.toLocaleString()}</div></div>
              <div><span className="text-[10px] text-muted-foreground">止盈</span><div className="text-sm font-mono font-semibold text-bull">${signal.takeProfit.toLocaleString()}</div></div>
              <div><span className="text-[10px] text-muted-foreground">风险收益比</span><div className="text-sm font-mono font-semibold">1:{signal.riskReward}</div></div>
              <div><span className="text-[10px] text-muted-foreground">止损类型</span><div className="text-sm font-mono font-semibold">ATR止损</div></div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}
