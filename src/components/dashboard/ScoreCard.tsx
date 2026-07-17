import { Gauge, TrendingUp, MapPin, Zap } from 'lucide-react'
import type { LayerScore } from '@/types'

interface ScoreCardProps {
  finalScore: number
  layers: LayerScore[]
}

const layerConfig = [
  { icon: TrendingUp, label: '市场方向' },
  { icon: MapPin, label: '入场位置' },
  { icon: Zap, label: '15分钟触发' },
]

export default function ScoreCard({ finalScore, layers }: ScoreCardProps) {
  const scoreColor = finalScore >= 90 ? 'text-bull' : finalScore >= 75 ? 'text-signal-yellow' : finalScore >= 60 ? 'text-signal-blue' : 'text-muted-foreground'
  const scoreBg = finalScore >= 90 ? 'bg-bull/10' : finalScore >= 75 ? 'bg-signal-yellow/10' : 'bg-muted/30'
  const label = finalScore >= 90 ? '强烈做多' : finalScore >= 75 ? '谨慎做多' : finalScore >= 60 ? '中性' : '无信号'

  return (
    <div className="trading-card">
      <div className="flex items-center gap-2 mb-4">
        <Gauge size={16} className="text-signal-blue" />
        <span className="trading-label">Logic Stack Entry V3 评分引擎</span>
      </div>

      <div className={`flex items-center justify-between p-4 rounded-lg ${scoreBg} mb-4`}>
        <div>
          <div className="text-xs text-muted-foreground mb-1">最终评分</div>
          <div className={`text-3xl font-bold font-mono ${scoreColor}`}>{finalScore}/100</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{label}</div>
          <div className="text-xs text-muted-foreground">BTC做多机会</div>
        </div>
      </div>

      <div className="space-y-2">
        {layers.map((layer, i) => {
          const cfg = layerConfig[i] || { icon: TrendingUp, label: layer.name }
          const Icon = cfg.icon
          const layerColor = layer.status === 'pass' ? 'text-bull' : layer.status === 'warn' ? 'text-signal-yellow' : 'text-muted-foreground'
          return (
            <div key={layer.name} className="flex items-center justify-between p-2 rounded bg-muted/20">
              <div className="flex items-center gap-2">
                <Icon size={14} className={layerColor} />
                <div>
                  <div className="text-xs font-medium">{cfg.label}</div>
                  <div className="text-[10px] text-muted-foreground">{layer.details.slice(0, 2).join(' · ')}</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-mono font-semibold ${layerColor}`}>{layer.score}/{layer.maxScore}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
