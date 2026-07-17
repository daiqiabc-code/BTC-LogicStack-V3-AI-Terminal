import { useState, useEffect, useCallback } from 'react'
import { Bot, Shield, Beaker, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { fetchMarketSnapshot } from '@/lib/binance'
import { computeLogicStackScore } from '@/lib/scoring'

interface CommitteeMember {
  name: string; icon: typeof TrendingUp; role: string; color: string; bg: string
  vote: 'bull' | 'bear' | 'neutral'; confidence: number; reasoning: string
}

export default function AICommittee() {
  const [members, setMembers] = useState<CommitteeMember[]>([]); const [loading, setLoading] = useState(true)

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true); const snap = await fetchMarketSnapshot()
      const result = computeLogicStackScore(snap.klines15m, snap.klines1h, snap.klines4h, snap.funding.fundingRate, snap.openInterest.openInterest, parseFloat(snap.ticker.volume) * snap.ticker.price)
      const { score, regime, prediction } = result; const trendDirection = regime.regime
      setMembers([
        { name: '趋势分析师', icon: TrendingUp, role: '趋势判断', color: 'text-signal-blue', bg: 'bg-signal-blue/10',
          vote: trendDirection, confidence: regime.confidence,
          reasoning: trendDirection === 'bull' ? `EMA50 > EMA200 多头排列完好。ADX ${score.layers[0]?.details?.find(d => d.includes('ADX'))?.match(/[\d.]+/)?.[0] || 'N/A'} 趋势强劲。价格站上关键均线。` : trendDirection === 'bear' ? '空头结构确认。价格在关键EMA之下，动能偏向卖方。' : '市场盘整中，无明显方向偏好。ADX低于阈值，等待突破。' },
        { name: '风险管理员', icon: Shield, role: '风险控制', color: 'text-signal-yellow', bg: 'bg-signal-yellow/10',
          vote: score.finalScore >= 60 ? 'bull' : 'neutral', confidence: Math.min(90, Math.round(score.finalScore * 0.85)),
          reasoning: score.finalScore >= 75 ? `风险收益比良好。评分 ${score.finalScore}/100，仓位控制系统正常。` : score.finalScore >= 60 ? `中等风险。评分 ${score.finalScore}/100，建议缩小止损。` : `风险偏高。评分 ${score.finalScore}/100 低于阈值，建议等待。` },
        { name: '量化研究员', icon: Beaker, role: '参数优化', color: 'text-bull', bg: 'bg-bull/10',
          vote: prediction.prediction, confidence: prediction.confidence,
          reasoning: `AI模型显示 ${prediction.bullProbability}% 看涨概率。各层评分：方向 ${score.layers[0]?.score}/${score.layers[0]?.maxScore}，入场 ${score.layers[1]?.score}/${score.layers[1]?.maxScore}，触发 ${score.layers[2]?.score}/${score.layers[2]?.maxScore}。成交量分析支持${prediction.prediction === 'bull' ? '趋势延续' : '谨慎观望'}。` },
      ])
    } catch (err) { console.error('委员会分析失败:', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAnalysis() }, [loadAnalysis])

  const avgConfidence = members.length > 0 ? Math.round(members.reduce((sum, m) => sum + m.confidence, 0) / members.length) : 0
  const allBull = members.every(m => m.vote === 'bull'); const allBear = members.every(m => m.vote === 'bear')
  const consensus = allBull ? '看涨' : allBear ? '看跌' : '中性'
  const consensusColor = allBull ? 'text-bull' : allBear ? 'text-bear' : 'text-signal-yellow'
  const consensusScore = Math.round(avgConfidence * (allBull ? 1 : allBear ? 0.6 : 0.4))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold">AI交易委员会</h1><p className="text-xs text-muted-foreground mt-1">多角色共识决策 · 实时数据驱动</p></div>
        <button onClick={loadAnalysis} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-muted text-muted-foreground hover:bg-accent" disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />{loading ? '分析中...' : '刷新'}
        </button>
      </div>

      <div className={`trading-card ${allBull ? 'bg-bull/5 border-bull/20' : allBear ? 'bg-bear/5 border-bear/20' : 'bg-signal-yellow/5 border-signal-yellow/20'} border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Bot size={24} className={consensusColor} />
            <div><div className={`text-sm font-bold ${consensusColor}`}>AI共识：{consensus}</div>
              <div className="text-xs text-muted-foreground">{allBull ? '委员会一致投票看涨' : allBear ? '委员会一致看跌' : '意见分歧'}</div>
            </div>
          </div>
          <div className="text-right"><div className={`text-2xl font-bold font-mono ${consensusColor}`}>{consensusScore}</div><div className="text-[10px] text-muted-foreground">共识评分</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="trading-card animate-pulse"><div className="h-8 bg-muted rounded-lg mb-3" /><div className="h-4 bg-muted rounded w-2/3 mb-3" /><div className="h-2 bg-muted rounded-full mb-3" /><div className="space-y-1"><div className="h-3 bg-muted rounded" /><div className="h-3 bg-muted rounded w-4/5" /></div></div>
        )) : members.map((member) => {
          const Icon = member.icon
          return (
            <div key={member.name} className="trading-card">
              <div className="flex items-center gap-2 mb-3"><div className={`w-8 h-8 rounded-lg ${member.bg} flex items-center justify-center`}><Icon size={16} className={member.color} /></div>
                <div><div className="text-sm font-semibold">{member.name}</div><div className="text-[10px] text-muted-foreground">{member.role}</div></div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-lg font-bold ${member.vote === 'bull' ? 'text-bull' : member.vote === 'bear' ? 'text-bear' : 'text-signal-yellow'}`}>{member.vote === 'bull' ? '看涨 ▲' : member.vote === 'bear' ? '看跌 ▼' : '中性 ◆'}</span>
                <span className="text-xs text-muted-foreground">置信度 {member.confidence}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3"><div className={`h-full rounded-full ${member.vote === 'bull' ? 'bg-bull' : member.vote === 'bear' ? 'bg-bear' : 'bg-signal-yellow'}`} style={{ width: `${member.confidence}%` }} /></div>
              <p className="text-xs text-muted-foreground leading-relaxed">{member.reasoning}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
