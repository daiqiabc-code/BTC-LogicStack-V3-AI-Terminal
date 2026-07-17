import { useState, useEffect, useCallback } from 'react'
import { Brain, Layers, TrendingUp, MapPin, Zap, Gauge, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { fetchMarketSnapshot } from '@/lib/binance'
import { computeLogicStackScore } from '@/lib/scoring'
import type { LogicStackScore, AIPrediction, MarketRegime } from '@/types'

export default function LogicStack() {
  const [score, setScore] = useState<LogicStackScore | null>(null)
  const [regime, setRegime] = useState<{ regime: MarketRegime; confidence: number } | null>(null)
  const [prediction, setPrediction] = useState<AIPrediction | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEngine = useCallback(async () => {
    try {
      setLoading(true)
      const snap = await fetchMarketSnapshot()
      const result = computeLogicStackScore(snap.klines15m, snap.klines1h, snap.klines4h, snap.funding.fundingRate, snap.openInterest.openInterest, parseFloat(snap.ticker.volume) * snap.ticker.price)
      setScore(result.score); setRegime(result.regime); setPrediction(result.prediction)
    } catch (err) { console.error('评分引擎加载失败:', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadEngine() }, [loadEngine])

  const finalScore = score?.finalScore ?? 0
  const scoreColor = finalScore >= 90 ? 'text-bull' : finalScore >= 75 ? 'text-signal-yellow' : finalScore >= 60 ? 'text-signal-blue' : 'text-muted-foreground'
  const scoreLabel = finalScore >= 90 ? '强烈做多机会' : finalScore >= 75 ? '中等做多机会' : finalScore >= 60 ? '中性' : '无信号'

  const layerConfig = [
    { name: '第一层：市场方向', icon: TrendingUp, max: 30, color: 'text-signal-blue' },
    { name: '第二层：入场位置', icon: MapPin, max: 40, color: 'text-signal-yellow' },
    { name: '第三层：15分钟触发', icon: Zap, max: 30, color: 'text-bull' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Logic Stack Entry V3</h1>
          <p className="text-xs text-muted-foreground mt-1">AI交易评分引擎 · 三层架构 · 实时数据驱动</p>
        </div>
        <button onClick={loadEngine} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-muted text-muted-foreground hover:bg-accent" disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />{loading ? '计算中...' : '刷新'}
        </button>
      </div>

      <div className="trading-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Gauge size={20} className="text-signal-blue" /><span className="trading-label">V3引擎最终评分</span></div>
          {regime && <span className={`text-xs font-semibold px-2 py-1 rounded ${regime.regime === 'bull' ? 'bg-bull/10 text-bull' : regime.regime === 'bear' ? 'bg-bear/10 text-bear' : 'bg-yellow-400/10 text-yellow-400'}`}>
            {regime.regime === 'bull' ? '多头趋势' : regime.regime === 'bear' ? '空头趋势' : '震荡'} · {regime.confidence}%
          </span>}
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">计算评分中...</div>
        ) : (
          <div className="flex items-end gap-4 mt-3">
            <div className={`text-5xl font-bold font-mono ${scoreColor}`}>{finalScore}</div>
            <div className="pb-1"><div className="text-lg font-semibold">{scoreLabel}</div><div className="text-xs text-muted-foreground">BTC做多机会 · {finalScore >= 60 ? '已确认' : '未就绪'}</div></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(score?.layers || []).map((layer, i) => {
          const Icon = layerConfig[i]?.icon || TrendingUp
          const config = layerConfig[i] || { color: 'text-foreground', max: 30, name: '' }
          const StatusIcon = layer.status === 'pass' ? CheckCircle : layer.status === 'warn' ? AlertTriangle : XCircle
          const statusColor = layer.status === 'pass' ? 'text-bull' : layer.status === 'warn' ? 'text-signal-yellow' : 'text-muted-foreground'
          return (
            <div key={layer.name} className="trading-card">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 ${config.color}`}><Icon size={18} /><span className="text-sm font-semibold">{config.name}</span></div>
                <StatusIcon size={16} className={statusColor} />
              </div>
              <div className="flex items-baseline gap-1 mb-2"><span className={`text-2xl font-bold font-mono ${statusColor}`}>{layer.score}</span><span className="text-sm text-muted-foreground">/ {layer.maxScore}</span></div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-500 ${layer.status === 'pass' ? 'bg-bull' : layer.status === 'warn' ? 'bg-signal-yellow' : 'bg-muted-foreground'}`} style={{ width: `${(layer.score / layer.maxScore) * 100}%` }} />
              </div>
              <div className="space-y-1">{layer.details.map((d, di) => (
                <div key={di} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className={`mt-0.5 ${d.includes('✓') ? 'text-bull' : ''}`}>{d.includes('✓') ? '◆' : '◇'}</span>
                  <span>{d}</span>
                </div>
              ))}</div>
            </div>
          )
        })}
      </div>

      {prediction && (
        <div className="trading-card">
          <div className="flex items-center gap-2 mb-3"><Brain size={16} className="text-signal-blue" /><span className="trading-label">AI预测摘要</span></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded bg-bull/10"><div className="text-xs text-muted-foreground">看涨</div><div className="text-2xl font-bold font-mono text-bull">{prediction.bullProbability}%</div></div>
            <div className="text-center p-3 rounded bg-muted/20"><div className="text-xs text-muted-foreground">共识</div><div className={`text-lg font-bold font-mono ${prediction.prediction === 'bull' ? 'text-bull' : prediction.prediction === 'bear' ? 'text-bear' : 'text-signal-yellow'}`}>{prediction.prediction === 'bull' ? '看涨' : prediction.prediction === 'bear' ? '看跌' : '中性'}</div></div>
            <div className="text-center p-3 rounded bg-bear/10"><div className="text-xs text-muted-foreground">看跌</div><div className="text-2xl font-bold font-mono text-bear">{prediction.bearProbability}%</div></div>
          </div>
        </div>
      )}

      <div className="trading-card border-l-4 border-l-signal-blue">
        <div className="flex items-center gap-2 mb-2"><Brain size={16} className="text-signal-blue" /><span className="trading-label">策略宪法 — 不可修改的核心规则</span></div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>🔒 以下规则不可修改：</p>
          <ul className="list-disc list-inside space-y-0.5"><li>趋势过滤（Layer 1）为入场必要条件</li><li>风险控制必须始终启用</li><li>所有策略变更须通过回测验证</li></ul>
          <p className="mt-2 text-signal-yellow">⚡ AI可优化的范围：参数、风险比例、仓位管理</p>
        </div>
      </div>

      <div className="trading-card">
        <div className="flex items-center gap-2 mb-3"><Layers size={16} className="text-signal-blue" /><span className="trading-label">策略版本</span></div>
        <div className="space-y-2">
          {[{ v: 'V3', desc: '三层评分 + AI预测 + 实时Binance数据', active: true }, { v: 'V2', desc: '基础EMA+RSI评分（模拟数据）', active: false }, { v: 'V1', desc: '简单趋势跟踪', active: false }].map((ver) => (
            <div key={ver.v} className={`flex items-center justify-between p-2 rounded ${ver.active ? 'bg-primary/5 border border-primary/20' : 'bg-muted/20'}`}>
              <div className="flex items-center gap-2"><span className={`text-xs font-bold px-2 py-0.5 rounded ${ver.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{ver.v}</span><span className="text-sm">{ver.desc}</span></div>
              {ver.active && <span className="text-xs text-bull">● 当前版本</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
