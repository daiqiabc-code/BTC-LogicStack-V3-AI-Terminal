import { Brain, TrendingUp, TrendingDown } from 'lucide-react'

interface AIPredictionPanelProps {
  bullProb: number
  bearProb: number
  confidence: number
}

export default function AIPredictionPanel({ bullProb, bearProb, confidence }: AIPredictionPanelProps) {
  const dominant = bullProb >= bearProb ? 'bull' : 'bear'
  const dominantProb = dominant === 'bull' ? bullProb : bearProb
  const isHighConfidence = confidence >= 70

  return (
    <div className="trading-card">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-signal-blue" />
        <span className="trading-label">AI概率预测引擎</span>
      </div>

      <div className="text-center mb-4">
        <span className="text-xs text-muted-foreground">未来24小时展望</span>
        <div className={`flex items-center justify-center gap-2 mt-1 ${dominant === 'bull' ? 'text-bull' : 'text-bear'}`}>
          {dominant === 'bull' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          <span className="text-2xl font-bold">{dominantProb}%</span>
        </div>
        <span className="text-xs text-muted-foreground">{dominant === 'bull' ? '看涨概率' : '看跌概率'}</span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-bull">看涨</span>
            <span className="text-bull font-mono">{bullProb}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-bull rounded-full transition-all" style={{ width: `${bullProb}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-bear">看跌</span>
            <span className="text-bear font-mono">{bearProb}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-bear rounded-full transition-all" style={{ width: `${bearProb}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between p-2 rounded bg-muted/30">
        <span className="text-xs text-muted-foreground">模型置信度</span>
        <span className={`text-sm font-semibold ${isHighConfidence ? 'text-bull' : 'text-signal-yellow'}`}>
          {confidence}%
        </span>
      </div>

      <div className="mt-2 text-[10px] text-muted-foreground/60 text-center">
        XGBoost模型 · 11维特征输入 · 预留真实模型接口
      </div>
    </div>
  )
}
