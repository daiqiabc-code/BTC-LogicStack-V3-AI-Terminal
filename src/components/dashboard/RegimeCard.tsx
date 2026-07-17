import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { MarketRegime } from '@/types'

interface RegimeCardProps {
  regime: MarketRegime
  confidence: number
  score: number
}

export default function RegimeCard({ regime, confidence, score }: RegimeCardProps) {
  const config = {
    bull: { icon: TrendingUp, color: 'text-bull', bg: 'bg-bull/10', label: '多头趋势' },
    bear: { icon: TrendingDown, color: 'text-bear', bg: 'bg-bear/10', label: '空头趋势' },
    range: { icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: '震荡' },
  }
  const c = config[regime]
  const Icon = c.icon

  const scoreColor = score >= 90 ? 'text-bull' : score >= 75 ? 'text-signal-yellow' : 'text-muted-foreground'
  const scoreLabel = score >= 90 ? '强烈做多机会' : score >= 75 ? '中等机会' : '无信号'

  return (
    <div className="trading-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="trading-label">市场状态</span>
          <div className={`flex items-center gap-2 mt-1 ${c.color}`}>
            <Icon size={20} />
            <span className="text-lg font-bold">{c.label}</span>
          </div>
        </div>
        <Brain size={20} className="text-muted-foreground" />
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">AI置信度</span>
          <span className={c.color}>{confidence}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              regime === 'bull' ? 'bg-bull' : regime === 'bear' ? 'bg-bear' : 'bg-yellow-400'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
        <span className="text-sm text-muted-foreground">V3引擎评分</span>
        <div className="text-right">
          <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{score}/100</span>
          <div className="text-xs text-muted-foreground">{scoreLabel}</div>
        </div>
      </div>
    </div>
  )
}
